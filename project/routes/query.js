const express = require('express');
const refragEngine = require('../utils/refragEngine');

const router = express.Router();

// Query endpoint - compressed mode
router.post('/', async (req, res) => {
  try {
    const { query, mode } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`Processing query: "${query}" (mode: ${mode || 'compressed'})`);

    const result = await refragEngine.processQuery(query, mode || 'compressed');

    res.json({
      success: true,
      query,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ 
      error: 'Failed to process query',
      details: error.message 
    });
  }
});

// Compare endpoint - run both baseline and compressed
router.post('/compare', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`Running comparison for query: "${query}"`);

    const result = await refragEngine.compareModels(query);

    res.json({
      success: true,
      query,
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ 
      error: 'Failed to compare models',
      details: error.message 
    });
  }
});

module.exports = router;
