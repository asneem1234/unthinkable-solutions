const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const { getVectorDB } = require('../utils/vectorDB');
const textProcessor = require('../utils/textProcessor');
const metricsRouter = require('./metrics');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, DOC, DOCX are allowed.'));
    }
  }
});

// Upload document endpoint
router.post('/', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const startTime = Date.now();
    const documentId = uuidv4();
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    console.log(`Processing document: ${fileName}`);

    // Extract text based on file type
    let text = '';
    const ext = path.extname(fileName).toLowerCase();

    if (ext === '.pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (ext === '.txt') {
      text = await fs.readFile(filePath, 'utf-8');
    } else {
      // For .doc/.docx, you'd need additional libraries like mammoth
      return res.status(400).json({ 
        error: 'DOC/DOCX support not yet implemented. Please use PDF or TXT files.' 
      });
    }

    if (!text || text.trim().length === 0) {
      await fs.unlink(filePath); // Clean up
      return res.status(400).json({ error: 'No text could be extracted from the document' });
    }

    // Chunk the text
    const chunkSize = parseInt(process.env.CHUNK_SIZE) || 512;
    const chunkOverlap = parseInt(process.env.CHUNK_OVERLAP) || 100;
    const chunks = textProcessor.chunkText(text, chunkSize, chunkOverlap);

    // Add to vector database
    const vectorDB = await getVectorDB();
    await vectorDB.addDocuments(chunks, documentId, {
      document_name: fileName,
      file_type: ext,
      upload_date: new Date().toISOString()
    });

    // Clean up uploaded file
    await fs.unlink(filePath);

    const processingTime = Date.now() - startTime;

    // Update document count in metrics
    const documents = await vectorDB.getAllDocuments();
    if (metricsRouter.updateDocumentCount) {
      metricsRouter.updateDocumentCount(documents.length);
    }

    res.json({
      success: true,
      documentId,
      fileName,
      chunks: chunks.length,
      processingTime: `${processingTime}ms`,
      message: 'Document uploaded and indexed successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }
    }

    res.status(500).json({ 
      error: 'Failed to process document',
      details: error.message 
    });
  }
});

module.exports = router;
