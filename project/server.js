const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const uploadRoutes = require('./routes/upload');
const queryRoutes = require('./routes/query');
const documentsRoutes = require('./routes/documents');
const metricsRoutes = require('./routes/metrics');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default route - serve landing page (MUST be before static middleware)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/metrics', metricsRoutes);

// Serve static files (frontend) - AFTER the root route
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'REFRAG RAG System is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   REFRAG-Inspired RAG System Server               ║
║   Port: ${PORT}                                     ║
║   Environment: ${process.env.NODE_ENV || 'development'}                        ║
║   Frontend: http://localhost:${PORT}               ║
║   API: http://localhost:${PORT}/api                ║
╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = app;
