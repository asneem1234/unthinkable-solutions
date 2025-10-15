require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const qdrantService = require('./services/qdrantService');
const ragService = require('./services/ragService');
const documentProcessor = require('./services/documentProcessor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, DOC, and DOCX are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Knowledge Base RAG Engine is running',
    timestamp: new Date().toISOString()
  });
});

// Initialize Qdrant collection
app.post('/api/initialize', async (req, res) => {
  try {
    await qdrantService.initializeCollection();
    res.json({ 
      success: true, 
      message: 'Qdrant collection initialized successfully' 
    });
  } catch (error) {
    console.error('Initialization error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Upload and process documents
app.post('/api/upload', upload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No files uploaded' 
      });
    }

    const results = [];
    
    for (const file of req.files) {
      try {
        console.log(`Processing file: ${file.originalname}`);
        
        // Extract text from document
        const text = await documentProcessor.extractText(file.path);
        
        // Chunk the document
        const chunks = documentProcessor.chunkText(text, {
          chunkSize: parseInt(process.env.CHUNK_SIZE) || 512,
          chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 100
        });
        
        console.log(`Created ${chunks.length} chunks from ${file.originalname}`);
        
        // Store chunks in Qdrant
        await qdrantService.addDocumentChunks(chunks, {
          filename: file.originalname,
          uploadDate: new Date().toISOString(),
          totalChunks: chunks.length
        });
        
        results.push({
          filename: file.originalname,
          chunks: chunks.length,
          status: 'success'
        });
        
        // Clean up uploaded file
        await fs.unlink(file.path);
        
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);
        results.push({
          filename: file.originalname,
          status: 'error',
          error: error.message
        });
      }
    }
    
    res.json({ 
      success: true, 
      results,
      message: `Processed ${results.length} document(s)` 
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Query endpoint - RAG with optional comparison mode
app.post('/api/query', async (req, res) => {
  try {
    const { query, compareMode } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Query is required' 
      });
    }
    
    console.log(`Processing query: ${query} (Compare: ${compareMode || false})`);
    
    // Perform RAG (with optional comparison)
    const result = await ragService.query(query, compareMode || false);
    
    res.json({ 
      success: true, 
      ...result
    });
    
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get collection statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await qdrantService.getCollectionStats();
    res.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete all documents
app.delete('/api/documents', async (req, res) => {
  try {
    await qdrantService.clearCollection();
    res.json({ 
      success: true, 
      message: 'All documents deleted successfully' 
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// Initialize Qdrant (for serverless environments)
let isInitialized = false;
async function initializeQdrant() {
  if (!isInitialized) {
    try {
      await qdrantService.initializeCollection();
      console.log('✅ Qdrant collection initialized');
      isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Qdrant:', error.message);
    }
  }
}

// Start server (only if not in serverless environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`🚀 Knowledge Base RAG Engine running on port ${PORT}`);
    console.log(`📍 Frontend: http://localhost:${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api`);
    
    await initializeQdrant();
  });
}

// For Vercel serverless
module.exports = app;
