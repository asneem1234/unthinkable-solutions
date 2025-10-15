const express = require('express');

const router = express.Router();

// In-memory metrics storage (in production, use a proper database)
let systemMetrics = {
  totalQueries: 0,
  totalDocuments: 0,
  avgLatency: 0,
  totalTokens: 0,
  tokensSaved: 0,
  queriesHistory: []
};

// Get system metrics
router.get('/', (req, res) => {
  res.json({
    success: true,
    metrics: systemMetrics
  });
});

// Update metrics (called internally)
router.post('/update', (req, res) => {
  try {
    const { queryMetrics } = req.body;

    systemMetrics.totalQueries++;
    systemMetrics.totalTokens += queryMetrics.tokensUsed || 0;
    
    // Calculate running average for latency
    systemMetrics.avgLatency = 
      (systemMetrics.avgLatency * (systemMetrics.totalQueries - 1) + queryMetrics.totalTime) 
      / systemMetrics.totalQueries;

    // Store query history (keep last 100)
    systemMetrics.queriesHistory.unshift({
      timestamp: new Date().toISOString(),
      latency: queryMetrics.totalTime,
      tokens: queryMetrics.tokensUsed,
      mode: queryMetrics.mode || 'compressed'
    });

    if (systemMetrics.queriesHistory.length > 100) {
      systemMetrics.queriesHistory.pop();
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error updating metrics:', error);
    res.status(500).json({ 
      error: 'Failed to update metrics',
      details: error.message 
    });
  }
});

// Update document count
router.post('/documents', (req, res) => {
  try {
    const { count } = req.body;
    systemMetrics.totalDocuments = count || 0;
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating document count:', error);
    res.status(500).json({ 
      error: 'Failed to update document count',
      details: error.message 
    });
  }
});

// Reset metrics
router.post('/reset', (req, res) => {
  systemMetrics = {
    totalQueries: 0,
    totalDocuments: 0,
    avgLatency: 0,
    totalTokens: 0,
    tokensSaved: 0,
    queriesHistory: []
  };

  res.json({ 
    success: true,
    message: 'Metrics reset successfully' 
  });
});

// Export the metrics object so it can be updated from other modules
module.exports = router;
module.exports.updateDocumentCount = (count) => {
  systemMetrics.totalDocuments = count;
};
module.exports.getMetrics = () => systemMetrics;
