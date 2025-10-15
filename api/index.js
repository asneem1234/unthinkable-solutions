let app;

// Lazy load the app to catch initialization errors
try {
  app = require('../server');
} catch (error) {
  console.error('Error loading server:', error);
}

// Export handler for Vercel serverless
module.exports = async (req, res) => {
  try {
    if (!app) {
      return res.status(500).json({ 
        error: 'Server initialization failed',
        message: 'Please check deployment logs'
      });
    }
    return app(req, res);
  } catch (error) {
    console.error('Request error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
