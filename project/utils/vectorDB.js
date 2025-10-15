const { ChromaClient } = require('chromadb');
const dotenv = require('dotenv');

dotenv.config();

class VectorDatabase {
  constructor() {
    this.client = null;
    this.collection = null;
    this.embedder = null;
    this.collectionName = 'documents';
    this.pipeline = null;
  }

  async initialize() {
    try {
      // Dynamically import @xenova/transformers (ES Module)
      const { pipeline } = await import('@xenova/transformers');
      this.pipeline = pipeline;

      // Initialize ChromaDB client with support for remote hosting
      const chromaHost = process.env.CHROMA_HOST || 'localhost';
      const chromaPort = process.env.CHROMA_PORT || '8000';
      const chromaSSL = process.env.CHROMA_SSL === 'true';
      const chromaUrl = process.env.CHROMA_URL || 
                       `${chromaSSL ? 'https' : 'http'}://${chromaHost}:${chromaPort}`;
      
      console.log(`Connecting to ChromaDB at ${chromaUrl}...`);
      
      const clientConfig = {
        path: chromaUrl
      };
      
      // Add authentication if API key is provided (for ChromaDB Cloud or secured instances)
      if (process.env.CHROMA_API_KEY) {
        clientConfig.auth = {
          provider: "token",
          credentials: process.env.CHROMA_API_KEY
        };
        console.log('Using API key authentication for ChromaDB');
      }
      
      this.client = new ChromaClient(clientConfig);

      // Initialize embedding model
      console.log('Loading embedding model...');
      this.embedder = await this.pipeline(
        'feature-extraction',
        process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2'
      );

      // Get or create collection
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName
        });
        console.log('✓ Connected to existing collection');
      } catch (error) {
        console.log('Creating new collection...');
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: { description: 'REFRAG RAG System Documents' }
        });
        console.log('✓ Created new collection');
      }

      console.log('✓ Vector Database initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing vector database:', error);
      throw error;
    }
  }

  async generateEmbedding(text) {
    try {
      const output = await this.embedder(text, {
        pooling: 'mean',
        normalize: true
      });
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async addDocuments(chunks, documentId, metadata = {}) {
    try {
      const ids = [];
      const embeddings = [];
      const documents = [];
      const metadatas = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${documentId}_chunk_${i}`;
        const embedding = await this.generateEmbedding(chunks[i]);

        ids.push(chunkId);
        embeddings.push(embedding);
        documents.push(chunks[i]);
        metadatas.push({
          ...metadata,
          document_id: documentId,
          chunk_index: i,
          chunk_size: chunks[i].length,
          timestamp: new Date().toISOString()
        });
      }

      await this.collection.add({
        ids,
        embeddings,
        documents,
        metadatas
      });

      console.log(`✓ Added ${chunks.length} chunks for document ${documentId}`);
      return { success: true, chunks: chunks.length };
    } catch (error) {
      console.error('Error adding documents:', error);
      throw error;
    }
  }

  async search(query, topK = 8) {
    try {
      const queryEmbedding = await this.generateEmbedding(query);

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK
      });

      // Format results
      const formattedResults = [];
      if (results.documents && results.documents[0]) {
        for (let i = 0; i < results.documents[0].length; i++) {
          formattedResults.push({
            id: results.ids[0][i],
            text: results.documents[0][i],
            distance: results.distances[0][i],
            relevanceScore: 1 - results.distances[0][i], // Convert distance to similarity
            metadata: results.metadatas[0][i]
          });
        }
      }

      return formattedResults;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  async deleteDocument(documentId) {
    try {
      // Get all chunks for this document
      const results = await this.collection.get({
        where: { document_id: documentId }
      });

      if (results.ids && results.ids.length > 0) {
        await this.collection.delete({
          ids: results.ids
        });
        console.log(`✓ Deleted document ${documentId} (${results.ids.length} chunks)`);
        return { success: true, deletedChunks: results.ids.length };
      }

      return { success: false, message: 'Document not found' };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async getAllDocuments() {
    try {
      const results = await this.collection.get({});
      
      // Group by document_id
      const documents = {};
      if (results.metadatas && results.metadatas.length > 0) {
        results.metadatas.forEach(meta => {
          const docId = meta.document_id;
          if (!documents[docId]) {
            documents[docId] = {
              id: docId,
              name: meta.document_name || 'Unknown Document',
              chunks: 0,
              timestamp: meta.upload_date || meta.timestamp || new Date().toISOString()
            };
          }
          documents[docId].chunks++;
        });
      }

      return Object.values(documents);
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  async clearCollection() {
    try {
      await this.client.deleteCollection({ name: this.collectionName });
      this.collection = await this.client.createCollection({
        name: this.collectionName,
        metadata: { description: 'REFRAG RAG System Documents' }
      });
      console.log('✓ Collection cleared');
      return { success: true };
    } catch (error) {
      console.error('Error clearing collection:', error);
      throw error;
    }
  }
}

// Singleton instance
let vectorDB = null;

const getVectorDB = async () => {
  if (!vectorDB) {
    vectorDB = new VectorDatabase();
    await vectorDB.initialize();
  }
  return vectorDB;
};

module.exports = { VectorDatabase, getVectorDB };
