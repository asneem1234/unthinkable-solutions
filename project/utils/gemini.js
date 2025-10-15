const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
  }

  initialize() {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not found in environment variables');
      }

      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Use Gemini 2.0 Flash - fast and versatile multimodal model
      this.model = this.genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });
      
      console.log('✓ Gemini AI initialized successfully (models/gemini-2.0-flash)');
      return true;
    } catch (error) {
      console.error('Error initializing Gemini:', error);
      throw error;
    }
  }

  async generateAnswer(query, context, mode = 'compressed') {
    try {
      const prompt = this.buildPrompt(query, context, mode);
      
      const startTime = Date.now();
      const result = await this.model.generateContent(prompt);
      const latency = Date.now() - startTime;

      const response = await result.response;
      const answer = response.text();

      // Count tokens (approximation)
      const promptTokens = this.estimateTokens(prompt);
      const completionTokens = this.estimateTokens(answer);

      return {
        answer,
        latency,
        metrics: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          latencyMs: latency
        }
      };
    } catch (error) {
      console.error('Error generating answer:', error);
      throw error;
    }
  }

  buildPrompt(query, context, mode) {
    const systemPrompt = `You are a knowledgeable AI assistant. Answer questions based ONLY on the provided context. 
If the information is not in the context, clearly state that you don't have enough information to answer.
Be concise, accurate, and cite specific parts of the context when possible.`;

    let contextSection = '';
    
    if (mode === 'compressed') {
      // Separate high-relevance and compressed context
      const highRelevance = context.highRelevance || [];
      const compressed = context.compressed || '';

      contextSection = `
HIGH-RELEVANCE CONTEXT (Full Detail):
${highRelevance.map((chunk, i) => `[${i + 1}] ${chunk.text}`).join('\n\n')}

${compressed ? `\nADDITIONAL CONTEXT (Summary):
${compressed}` : ''}
`;
    } else {
      // Baseline mode - all context
      const allChunks = context.allChunks || [];
      contextSection = `
CONTEXT:
${allChunks.map((chunk, i) => `[${i + 1}] ${chunk.text}`).join('\n\n')}
`;
    }

    return `${systemPrompt}

${contextSection}

QUESTION: ${query}

ANSWER:`;
  }

  estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  async summarizeChunks(chunks) {
    try {
      const textsToSummarize = chunks.map(c => c.text).join('\n\n');
      
      const prompt = `Provide a very brief summary (2-3 sentences) of the following text passages. 
Focus on the key information:

${textsToSummarize}

SUMMARY:`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error summarizing chunks:', error);
      // Fallback: just concatenate
      return chunks.map(c => c.text.substring(0, 100)).join(' ... ');
    }
  }
}

// Singleton instance
let geminiService = null;

const getGeminiService = () => {
  if (!geminiService) {
    geminiService = new GeminiService();
    geminiService.initialize();
  }
  return geminiService;
};

module.exports = { GeminiService, getGeminiService };
