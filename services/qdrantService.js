const { QdrantClient } = require('@qdrant/js-client-rest');
const { v4: uuidv4 } = require('uuid');
const embeddingService = require('./embeddingService');

class QdrantService {
  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
    this.collectionName = 'knowledge_base';
    this.vectorSize = 384; // MiniLM-L6-v2 embedding dimension
  }

  async initializeCollection() {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        col => col.name === this.collectionName
      );

      if (exists) {
        console.log(`Collection '${this.collectionName}' already exists`);
        return;
      }

      // Create collection
      await this.client.createCollection(this.collectionName, {
        vectors: {
          size: this.vectorSize,
          distance: 'Cosine',
        },
      });

      console.log(`Collection '${this.collectionName}' created successfully`);
    } catch (error) {
      console.error('Error initializing collection:', error);
      throw error;
    }
  }

  async addDocumentChunks(chunks, metadata) {
    try {
      const points = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Generate embedding for the chunk
        const embedding = await embeddingService.generateEmbedding(chunk);
        
        points.push({
          id: uuidv4(),
          vector: embedding,
          payload: {
            text: chunk,
            filename: metadata.filename,
            chunkIndex: i,
            totalChunks: metadata.totalChunks,
            uploadDate: metadata.uploadDate,
          }
        });
      }

      // Upload points in batches
      const batchSize = 100;
      for (let i = 0; i < points.length; i += batchSize) {
        const batch = points.slice(i, i + batchSize);
        await this.client.upsert(this.collectionName, {
          wait: true,
          points: batch,
        });
        console.log(`Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)}`);
      }

      console.log(`Successfully added ${points.length} chunks to Qdrant`);
      return points.length;
    } catch (error) {
      console.error('Error adding document chunks:', error);
      throw error;
    }
  }

  async searchSimilar(queryText, limit = 5) {
    try {
      // Generate embedding for query
      const queryEmbedding = await embeddingService.generateEmbedding(queryText);
      
      // Search in Qdrant
      const searchResult = await this.client.search(this.collectionName, {
        vector: queryEmbedding,
        limit: limit,
        with_payload: true,
      });

      return searchResult.map(result => ({
        text: result.payload.text,
        filename: result.payload.filename,
        chunkIndex: result.payload.chunkIndex,
        score: result.score,
        uploadDate: result.payload.uploadDate,
      }));
    } catch (error) {
      console.error('Error searching similar chunks:', error);
      throw error;
    }
  }

  async getCollectionStats() {
    try {
      const collectionInfo = await this.client.getCollection(this.collectionName);
      return {
        name: this.collectionName,
        pointsCount: collectionInfo.points_count,
        vectorSize: collectionInfo.config.params.vectors.size,
        status: collectionInfo.status,
      };
    } catch (error) {
      console.error('Error getting collection stats:', error);
      throw error;
    }
  }

  async clearCollection() {
    try {
      // Delete and recreate collection
      await this.client.deleteCollection(this.collectionName);
      await this.initializeCollection();
      console.log('Collection cleared successfully');
    } catch (error) {
      console.error('Error clearing collection:', error);
      throw error;
    }
  }
}

module.exports = new QdrantService();
