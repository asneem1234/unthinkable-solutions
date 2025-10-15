const { getVectorDB } = require('./vectorDB');
const { getGeminiService } = require('./gemini');
const textProcessor = require('./textProcessor');

class REFRAGEngine {
  constructor() {
    this.topK = parseInt(process.env.TOP_K_RETRIEVAL) || 8;
    this.topKUncompressed = parseInt(process.env.TOP_K_UNCOMPRESSED) || 3;
  }

  async processQuery(query, mode = 'compressed') {
    try {
      const startTime = Date.now();
      const metrics = {
        retrievalTime: 0,
        compressionTime: 0,
        generationTime: 0,
        totalTime: 0,
        tokensUsed: 0,
        chunksRetrieved: 0,
        chunksCompressed: 0
      };

      // Step 1: Dense Retrieval
      const retrievalStart = Date.now();
      const vectorDB = await getVectorDB();
      const denseResults = await vectorDB.search(query, this.topK);
      metrics.retrievalTime = Date.now() - retrievalStart;
      metrics.chunksRetrieved = denseResults.length;

      if (denseResults.length === 0) {
        return {
          answer: "I couldn't find any relevant information in the knowledge base to answer your question.",
          sources: [],
          metrics
        };
      }

      // Step 2: Sparse Retrieval (BM25)
      const bm25Results = textProcessor.calculateBM25(query, denseResults);

      // Step 3: Fusion scoring
      const fusedResults = bm25Results.map(result => ({
        ...result,
        fusedScore: textProcessor.fusionScore(
          result.relevanceScore,
          this.normalizeBM25(result.bm25Score, bm25Results)
        )
      })).sort((a, b) => b.fusedScore - a.fusedScore);

      // Step 4: Selective Compression (REFRAG)
      let context;
      const compressionStart = Date.now();

      if (mode === 'compressed') {
        // Compress lower-relevance chunks
        const highRelevance = fusedResults.slice(0, this.topKUncompressed);
        const lowRelevance = fusedResults.slice(this.topKUncompressed);
        
        metrics.chunksCompressed = lowRelevance.length;

        // Summarize low-relevance chunks
        let compressedContext = '';
        if (lowRelevance.length > 0) {
          const gemini = getGeminiService();
          compressedContext = await gemini.summarizeChunks(lowRelevance);
        }

        context = {
          highRelevance,
          compressed: compressedContext
        };
      } else {
        // Baseline: use all chunks
        context = {
          allChunks: fusedResults
        };
      }

      metrics.compressionTime = Date.now() - compressionStart;

      // Step 5: Generate Answer
      const generationStart = Date.now();
      const gemini = getGeminiService();
      const result = await gemini.generateAnswer(query, context, mode);
      metrics.generationTime = Date.now() - generationStart;

      metrics.totalTime = Date.now() - startTime;
      metrics.tokensUsed = result.metrics.totalTokens;

      // Calculate savings
      const compressionRatio = mode === 'compressed' 
        ? (metrics.chunksCompressed / metrics.chunksRetrieved) * 100 
        : 0;

      return {
        answer: result.answer,
        sources: fusedResults.slice(0, 5).map(r => ({
          text: r.text.substring(0, 200) + '...',
          relevance: r.fusedScore,
          metadata: r.metadata
        })),
        metrics: {
          ...metrics,
          compressionRatio: compressionRatio.toFixed(2) + '%',
          latencyMs: metrics.totalTime,
          promptTokens: result.metrics.promptTokens,
          completionTokens: result.metrics.completionTokens
        },
        mode
      };
    } catch (error) {
      console.error('Error processing query:', error);
      throw error;
    }
  }

  async compareModels(query) {
    try {
      console.log('Running comparison for query:', query);
      
      // Run both modes
      const baselineStart = Date.now();
      const baselineResult = await this.processQuery(query, 'baseline');
      const baselineTime = Date.now() - baselineStart;

      const compressedStart = Date.now();
      const compressedResult = await this.processQuery(query, 'compressed');
      const compressedTime = Date.now() - compressedStart;

      // Calculate improvements
      const latencyImprovement = ((baselineTime - compressedTime) / baselineTime * 100).toFixed(2);
      const tokenSavings = ((baselineResult.metrics.tokensUsed - compressedResult.metrics.tokensUsed) 
        / baselineResult.metrics.tokensUsed * 100).toFixed(2);

      return {
        baseline: {
          answer: baselineResult.answer,
          metrics: baselineResult.metrics
        },
        compressed: {
          answer: compressedResult.answer,
          metrics: compressedResult.metrics
        },
        improvements: {
          latencyReduction: latencyImprovement + '%',
          tokenSavings: tokenSavings + '%',
          fasterBy: (baselineTime - compressedTime) + 'ms'
        }
      };
    } catch (error) {
      console.error('Error comparing models:', error);
      throw error;
    }
  }

  normalizeBM25(score, allResults) {
    const scores = allResults.map(r => r.bm25Score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    return max === min ? 0.5 : (score - min) / (max - min);
  }
}

module.exports = new REFRAGEngine();
