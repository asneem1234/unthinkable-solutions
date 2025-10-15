/**
 * Intelligent Context Compression Service
 * Based on Meta's REFRAG research methodology
 * 
 * Core Innovation: Selective compression based on relevance scores
 * - Keep top-K most relevant chunks in full detail
 * - Compress remaining chunks to summaries
 * - Achieve 60-65% token reduction with minimal quality loss
 */

class CompressionService {
  constructor() {
    this.topKKeepFull = parseInt(process.env.TOP_K_KEEP_FULL) || 3;
    this.compressionRatio = parseFloat(process.env.COMPRESSION_RATIO) || 0.1;
  }

  /**
   * Apply selective compression to retrieved chunks
   * @param {Array} chunks - Retrieved chunks with scores
   * @returns {Object} Compressed context with metrics
   */
  compressContext(chunks) {
    if (!chunks || chunks.length === 0) {
      return {
        compressedContext: '',
        metrics: {
          totalChunks: 0,
          fullChunks: 0,
          compressedChunks: 0,
          originalTokens: 0,
          compressedTokens: 0,
          compressionRate: 0
        }
      };
    }

    // Sort by relevance score (highest first)
    const sortedChunks = [...chunks].sort((a, b) => b.score - a.score);

    // Split into high-relevance (keep full) and low-relevance (compress)
    const highRelevanceChunks = sortedChunks.slice(0, this.topKKeepFull);
    const lowRelevanceChunks = sortedChunks.slice(this.topKKeepFull);

    // Process high-relevance chunks (keep full text)
    const fullContext = this.formatFullChunks(highRelevanceChunks);
    
    // Process low-relevance chunks (compress)
    const compressedContext = this.formatCompressedChunks(lowRelevanceChunks);

    // Calculate token estimates
    const metrics = this.calculateMetrics(highRelevanceChunks, lowRelevanceChunks);

    // Combine contexts
    const finalContext = this.assembleContext(fullContext, compressedContext);

    return {
      compressedContext: finalContext,
      highRelevanceChunks,
      lowRelevanceChunks,
      metrics
    };
  }

  /**
   * Format high-relevance chunks (full text)
   */
  formatFullChunks(chunks) {
    if (chunks.length === 0) return '';

    const formatted = chunks.map((chunk, idx) => {
      return `[HIGH PRIORITY CONTEXT ${idx + 1}]\nSource: ${chunk.filename} (Relevance: ${(chunk.score * 100).toFixed(1)}%)\nContent:\n${chunk.text}\n`;
    });

    return formatted.join('\n---\n\n');
  }

  /**
   * Compress low-relevance chunks into summaries
   */
  formatCompressedChunks(chunks) {
    if (chunks.length === 0) return '';

    const compressed = chunks.map((chunk, idx) => {
      // Extract key sentences (simple extractive summarization)
      const summary = this.extractKeySentences(chunk.text);
      
      return `[Additional Context ${idx + 1}] Source: ${chunk.filename} (${(chunk.score * 100).toFixed(1)}% match) - ${summary}`;
    });

    return '\n[ADDITIONAL SUPPORTING CONTEXT]\n' + compressed.join('\n');
  }

  /**
   * Extract key sentences from text (simple extractive summarization)
   */
  extractKeySentences(text) {
    // Split into sentences
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    if (sentences.length === 0) return text.substring(0, 100) + '...';

    // For compression, take first 2-3 sentences or first ~150 chars
    const targetLength = Math.floor(text.length * this.compressionRatio);
    let summary = '';
    let charCount = 0;

    for (const sentence of sentences) {
      if (charCount + sentence.length > targetLength && summary.length > 0) {
        break;
      }
      summary += sentence + '. ';
      charCount += sentence.length;
    }

    return summary.trim() || text.substring(0, 150) + '...';
  }

  /**
   * Assemble final context with proper formatting
   */
  assembleContext(fullContext, compressedContext) {
    let context = '=== RETRIEVED CONTEXT ===\n\n';
    
    if (fullContext) {
      context += fullContext;
    }
    
    if (compressedContext) {
      context += '\n\n' + compressedContext;
    }

    return context;
  }

  /**
   * Calculate compression metrics
   */
  calculateMetrics(highRelevanceChunks, lowRelevanceChunks) {
    // Estimate tokens (rough: 1 token ≈ 4 characters)
    const estimateTokens = (text) => Math.ceil(text.length / 4);

    const fullTokens = highRelevanceChunks.reduce((sum, chunk) => 
      sum + estimateTokens(chunk.text), 0
    );

    const originalLowTokens = lowRelevanceChunks.reduce((sum, chunk) => 
      sum + estimateTokens(chunk.text), 0
    );

    const compressedLowTokens = lowRelevanceChunks.reduce((sum, chunk) => 
      sum + estimateTokens(this.extractKeySentences(chunk.text)), 0
    );

    const originalTotal = fullTokens + originalLowTokens;
    const compressedTotal = fullTokens + compressedLowTokens;
    const tokensSaved = originalTotal - compressedTotal;
    const compressionRate = originalTotal > 0 
      ? ((tokensSaved / originalTotal) * 100).toFixed(1)
      : 0;

    return {
      totalChunks: highRelevanceChunks.length + lowRelevanceChunks.length,
      fullChunks: highRelevanceChunks.length,
      compressedChunks: lowRelevanceChunks.length,
      originalTokens: originalTotal,
      compressedTokens: compressedTotal,
      tokensSaved: tokensSaved,
      compressionRate: parseFloat(compressionRate),
      avgRelevanceScore: this.calculateAvgScore([...highRelevanceChunks, ...lowRelevanceChunks])
    };
  }

  /**
   * Calculate average relevance score
   */
  calculateAvgScore(chunks) {
    if (chunks.length === 0) return 0;
    const sum = chunks.reduce((acc, chunk) => acc + chunk.score, 0);
    return (sum / chunks.length * 100).toFixed(1);
  }

  /**
   * Get baseline (uncompressed) context for comparison
   */
  getBaselineContext(chunks) {
    if (!chunks || chunks.length === 0) return '';

    const formatted = chunks.map((chunk, idx) => {
      return `[CONTEXT ${idx + 1}]\nSource: ${chunk.filename} (Relevance: ${(chunk.score * 100).toFixed(1)}%)\nContent:\n${chunk.text}\n`;
    });

    return '=== RETRIEVED CONTEXT ===\n\n' + formatted.join('\n---\n\n');
  }

  /**
   * Calculate baseline metrics (no compression)
   */
  getBaselineMetrics(chunks) {
    const estimateTokens = (text) => Math.ceil(text.length / 4);
    
    const totalTokens = chunks.reduce((sum, chunk) => 
      sum + estimateTokens(chunk.text), 0
    );

    return {
      totalChunks: chunks.length,
      fullChunks: chunks.length,
      compressedChunks: 0,
      originalTokens: totalTokens,
      compressedTokens: totalTokens,
      tokensSaved: 0,
      compressionRate: 0,
      avgRelevanceScore: this.calculateAvgScore(chunks)
    };
  }
}

module.exports = new CompressionService();
