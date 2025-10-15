class EmbeddingService {
  constructor() {
    this.model = null;
    this.pipeline = null;
    this.modelName = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
  }

  async initialize() {
    if (!this.model) {
      console.log(`Loading embedding model: ${this.modelName}...`);
      
      // Dynamic import for ES Module
      const { pipeline } = await import('@xenova/transformers');
      this.pipeline = pipeline;
      
      this.model = await this.pipeline('feature-extraction', this.modelName);
      console.log('Embedding model loaded successfully');
    }
    return this.model;
  }

  async generateEmbedding(text) {
    try {
      await this.initialize();
      
      // Generate embedding
      const output = await this.model(text, { pooling: 'mean', normalize: true });
      
      // Convert to array
      const embedding = Array.from(output.data);
      
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async generateBatchEmbeddings(texts) {
    try {
      await this.initialize();
      
      const embeddings = [];
      for (const text of texts) {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
      }
      
      return embeddings;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw error;
    }
  }
}

module.exports = new EmbeddingService();
