const express = require('express');
const { getVectorDB } = require('../utils/vectorDB');
const metricsRouter = require('./metrics');

const router = express.Router();

// Get all documents
router.get('/', async (req, res) => {
  try {
    const vectorDB = await getVectorDB();
    const documents = await vectorDB.getAllDocuments();

    // Update metrics with current document count
    if (metricsRouter.updateDocumentCount) {
      metricsRouter.updateDocumentCount(documents.length);
    }

    res.json({
      success: true,
      documents,
      count: documents.length
    });

  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve documents',
      details: error.message 
    });
  }
});

// Delete a document
router.delete('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    const vectorDB = await getVectorDB();
    const result = await vectorDB.deleteDocument(documentId);

    if (result.success) {
      // Update document count in metrics
      const documents = await vectorDB.getAllDocuments();
      if (metricsRouter.updateDocumentCount) {
        metricsRouter.updateDocumentCount(documents.length);
      }

      res.json({
        success: true,
        message: 'Document deleted successfully',
        deletedChunks: result.deletedChunks
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message || 'Document not found'
      });
    }

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ 
      error: 'Failed to delete document',
      details: error.message 
    });
  }
});

// Clear all documents
router.delete('/', async (req, res) => {
  try {
    const vectorDB = await getVectorDB();
    const result = await vectorDB.clearCollection();

    // Reset document count in metrics
    if (metricsRouter.updateDocumentCount) {
      metricsRouter.updateDocumentCount(0);
    }

    res.json({
      success: true,
      message: 'All documents cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing documents:', error);
    res.status(500).json({ 
      error: 'Failed to clear documents',
      details: error.message 
    });
  }
});

module.exports = router;
