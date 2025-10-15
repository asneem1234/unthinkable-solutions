const { GoogleGenerativeAI } = require('@google/generative-ai');
const qdrantService = require('./qdrantService');
const compressionService = require('./compressionService');

class RAGService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    });
  }

  /**
   * Query with comparison mode - runs both baseline and compressed
   * @param {string} userQuery - User's question
   * @param {boolean} compareMode - If true, run both baseline and compressed
   */
  async query(userQuery, compareMode = false) {
    try {
      if (compareMode) {
        return await this.queryWithComparison(userQuery);
      } else {
        return await this.queryCompressed(userQuery);
      }
    } catch (error) {
      console.error('RAG query error:', error);
      throw error;
    }
  }

  /**
   * Standard compressed query (default mode)
   */
  async queryCompressed(userQuery) {
    const startTime = Date.now();
    
    // Step 1: Retrieve relevant documents from Qdrant
    console.log('🔍 Retrieving relevant documents...');
    const topK = parseInt(process.env.TOP_K_RETRIEVAL) || 10;
    const retrievedChunks = await qdrantService.searchSimilar(userQuery, topK);
    
    if (retrievedChunks.length === 0) {
      return {
        answer: "I couldn't find any relevant information in the knowledge base to answer your question. Please try uploading relevant documents first.",
        sources: [],
        metadata: {
          totalTime: Date.now() - startTime,
          retrievalTime: Date.now() - startTime,
          synthesisTime: 0,
          chunksRetrieved: 0,
          confidence: 0,
          mode: 'compressed'
        }
      };
    }
    
    const retrievalTime = Date.now() - startTime;
    console.log(`✅ Retrieved ${retrievedChunks.length} chunks in ${retrievalTime}ms`);
    
    // Step 2: Apply intelligent compression
    console.log('📦 Applying selective compression...');
    const compressionStart = Date.now();
    const { compressedContext, metrics } = compressionService.compressContext(retrievedChunks);
    const compressionTime = Date.now() - compressionStart;
    console.log(`✅ Compressed: ${metrics.compressionRate}% reduction (${metrics.tokensSaved} tokens saved)`);
    
    // Step 3: Generate answer using Gemini
    console.log('🤖 Generating answer with Gemini...');
    const synthesisStart = Date.now();
    const answer = await this.generateAnswer(userQuery, compressedContext);
    const synthesisTime = Date.now() - synthesisStart;
    
    // Step 4: Prepare sources with citations
    const sources = this.prepareSources(retrievedChunks);
    
    // Step 5: Calculate confidence score
    const confidence = this.calculateConfidence(retrievedChunks);
    
    const totalTime = Date.now() - startTime;
    
    return {
      answer,
      sources,
      metadata: {
        totalTime,
        retrievalTime,
        compressionTime,
        synthesisTime,
        chunksRetrieved: retrievedChunks.length,
        confidence,
        mode: 'compressed',
        compression: metrics
      }
    };
  }

  /**
   * Comparison mode - runs both baseline and compressed in parallel
   */
  async queryWithComparison(userQuery) {
    const startTime = Date.now();
    
    // Step 1: Retrieve relevant documents (shared by both)
    console.log('🔍 Retrieving relevant documents for comparison...');
    const topK = parseInt(process.env.TOP_K_RETRIEVAL) || 10;
    const retrievedChunks = await qdrantService.searchSimilar(userQuery, topK);
    
    if (retrievedChunks.length === 0) {
      return {
        baseline: null,
        compressed: null,
        comparison: { error: 'No relevant documents found' }
      };
    }
    
    const retrievalTime = Date.now() - startTime;
    console.log(`✅ Retrieved ${retrievedChunks.length} chunks in ${retrievalTime}ms`);
    
    // Step 2: Run both methods
    console.log('⚡ Running baseline and compressed paths...');
    
    const [baselineResult, compressedResult] = await Promise.all([
      this.runBaseline(userQuery, retrievedChunks),
      this.runCompressed(userQuery, retrievedChunks)
    ]);
    
    // Step 3: Calculate comparison metrics
    const comparison = this.calculateComparison(baselineResult, compressedResult);
    
    return {
      baseline: baselineResult,
      compressed: compressedResult,
      comparison,
      retrievalTime,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Run baseline path (no compression)
   */
  async runBaseline(userQuery, chunks) {
    const start = Date.now();
    
    // Get uncompressed context
    const context = compressionService.getBaselineContext(chunks);
    const metrics = compressionService.getBaselineMetrics(chunks);
    
    // Generate answer
    const synthesisStart = Date.now();
    const answer = await this.generateAnswer(userQuery, context);
    const synthesisTime = Date.now() - synthesisStart;
    
    return {
      answer,
      sources: this.prepareSources(chunks),
      metadata: {
        totalTime: Date.now() - start,
        synthesisTime,
        chunksUsed: chunks.length,
        tokens: metrics.originalTokens,
        mode: 'baseline'
      }
    };
  }

  /**
   * Run compressed path
   */
  async runCompressed(userQuery, chunks) {
    const start = Date.now();
    
    // Apply compression
    const { compressedContext, metrics } = compressionService.compressContext(chunks);
    
    // Generate answer
    const synthesisStart = Date.now();
    const answer = await this.generateAnswer(userQuery, compressedContext);
    const synthesisTime = Date.now() - synthesisStart;
    
    return {
      answer,
      sources: this.prepareSources(chunks),
      metadata: {
        totalTime: Date.now() - start,
        synthesisTime,
        chunksUsed: chunks.length,
        fullChunks: metrics.fullChunks,
        compressedChunks: metrics.compressedChunks,
        tokens: metrics.compressedTokens,
        tokensSaved: metrics.tokensSaved,
        compressionRate: metrics.compressionRate,
        mode: 'compressed'
      }
    };
  }

  /**
   * Calculate comparison metrics
   */
  calculateComparison(baseline, compressed) {
    const timeSaved = baseline.metadata.totalTime - compressed.metadata.totalTime;
    const timeImprovement = ((timeSaved / baseline.metadata.totalTime) * 100).toFixed(1);
    
    const tokensSaved = baseline.metadata.tokens - compressed.metadata.tokens;
    const tokenReduction = ((tokensSaved / baseline.metadata.tokens) * 100).toFixed(1);
    
    // Estimate cost (Gemini Flash: ~$0.000001 per token)
    const baselineCost = (baseline.metadata.tokens * 0.000001).toFixed(6);
    const compressedCost = (compressed.metadata.tokens * 0.000001).toFixed(6);
    const costSavings = ((1 - (compressedCost / baselineCost)) * 100).toFixed(1);
    
    return {
      timeImprovement: {
        baseline: baseline.metadata.totalTime,
        compressed: compressed.metadata.totalTime,
        saved: timeSaved,
        improvement: parseFloat(timeImprovement)
      },
      tokenEfficiency: {
        baseline: baseline.metadata.tokens,
        compressed: compressed.metadata.tokens,
        saved: tokensSaved,
        reduction: parseFloat(tokenReduction)
      },
      costEfficiency: {
        baseline: parseFloat(baselineCost),
        compressed: parseFloat(compressedCost),
        savings: parseFloat(costSavings)
      }
    };
  }

  async generateAnswer(query, context) {
    try {
      // Create a comprehensive prompt
      const prompt = `You are a helpful AI assistant that answers questions based on provided documents. 

${context}

USER QUESTION: ${query}

INSTRUCTIONS:
1. Answer the question using ONLY the information from the context above
2. Be specific and cite which document(s) you're referencing
3. If the context doesn't contain enough information to answer fully, acknowledge that
4. Provide a clear, well-structured answer
5. If possible, synthesize information from multiple documents
6. Be concise but comprehensive

ANSWER:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();
      
      return answer;
    } catch (error) {
      console.error('Error generating answer:', error);
      throw new Error('Failed to generate answer from LLM');
    }
  }

  prepareSources(chunks) {
    // Group chunks by filename and prepare citations
    const sourceMap = new Map();
    
    chunks.forEach((chunk, idx) => {
      if (!sourceMap.has(chunk.filename)) {
        sourceMap.set(chunk.filename, {
          filename: chunk.filename,
          relevanceScore: chunk.score,
          excerpts: [],
          uploadDate: chunk.uploadDate
        });
      }
      
      const source = sourceMap.get(chunk.filename);
      source.excerpts.push({
        text: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
        score: chunk.score,
        chunkIndex: chunk.chunkIndex
      });
      
      // Keep the highest relevance score
      if (chunk.score > source.relevanceScore) {
        source.relevanceScore = chunk.score;
      }
    });
    
    return Array.from(sourceMap.values()).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  calculateConfidence(chunks) {
    if (chunks.length === 0) return 0;
    
    // Calculate average similarity score
    const avgScore = chunks.reduce((sum, chunk) => sum + chunk.score, 0) / chunks.length;
    
    // Convert to percentage (Cosine similarity is between 0 and 1)
    const confidence = Math.round(avgScore * 100);
    
    return confidence;
  }

  // Additional method for streaming responses (optional enhancement)
  async *queryStream(userQuery) {
    try {
      const topK = parseInt(process.env.TOP_K_RETRIEVAL) || 5;
      const retrievedChunks = await qdrantService.searchSimilar(userQuery, topK);
      
      if (retrievedChunks.length === 0) {
        yield { type: 'error', message: 'No relevant documents found' };
        return;
      }
      
      yield { type: 'retrieval', chunks: retrievedChunks.length };
      
      const context = this.prepareContext(retrievedChunks);
      const prompt = `You are a helpful AI assistant that answers questions based on provided documents.

CONTEXT: ${context}

QUESTION: ${userQuery}

Please answer based on the context above.

ANSWER:`;

      const result = await this.model.generateContentStream(prompt);
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        yield { type: 'content', text };
      }
      
      yield { 
        type: 'complete', 
        sources: this.prepareSources(retrievedChunks) 
      };
      
    } catch (error) {
      yield { type: 'error', message: error.message };
    }
  }
}

module.exports = new RAGService();
