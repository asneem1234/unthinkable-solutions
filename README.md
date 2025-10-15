# 🚀 Knowledge-Base RAG Search Engine

An advanced **Retrieval-Augmented Generation (RAG)** system that enables intelligent document search and question-answering using vector embeddings, Qdrant vector database, and Google's Gemini AI.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- **Document Upload & Processing**: Support for PDF, TXT, DOC, and DOCX files
- **Smart Text Chunking**: Intelligent document segmentation with configurable chunk sizes
- **Vector Embeddings**: Uses `Xenova/all-MiniLM-L6-v2` transformer model for high-quality embeddings
- **Vector Search**: Powered by Qdrant for fast and accurate semantic search
- **RAG Implementation**: Combines retrieval with Gemini AI for contextual answers
- **Real-time Search**: Instant search results with relevance scoring
- **Modern UI**: Clean and responsive web interface
- **RESTful API**: Easy integration with other applications

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Vector Database**: Qdrant
- **AI Models**: 
  - Google Gemini (gemini-1.5-flash) for text generation
  - Xenova Transformers (all-MiniLM-L6-v2) for embeddings
- **Document Processing**: pdf-parse, mammoth
- **Frontend**: Vanilla JavaScript, HTML5, CSS3

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**
- **Qdrant** (running locally or cloud instance)
- **Google Gemini API Key**

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/asneem1234/unthinkable-solutions.git
   cd unthinkable-solutions
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Qdrant**
   
   **Option A: Using Docker**
   ```bash
   docker pull qdrant/qdrant
   docker run -p 6333:6333 qdrant/qdrant
   ```
   
   **Option B: Qdrant Cloud**
   - Sign up at [Qdrant Cloud](https://cloud.qdrant.io/)
   - Create a cluster and get your API key

4. **Configure environment variables** (see next section)

5. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_COLLECTION=knowledge_base

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Document Processing
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

### Getting API Keys

- **Gemini API Key**: Get it from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Qdrant API Key**: Get it from [Qdrant Cloud Dashboard](https://cloud.qdrant.io/) (if using cloud)

## 🎯 Usage

1. **Start the application**
   ```bash
   npm start
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Upload documents**
   - Click on "Upload Document"
   - Select a PDF, TXT, DOC, or DOCX file (max 10MB)
   - Wait for processing confirmation

4. **Search and Ask Questions**
   - Enter your question in the search box
   - Get AI-powered answers with source references
   - View relevance scores for each result

## 📡 API Endpoints

### Upload Document
```http
POST /api/upload
Content-Type: multipart/form-data

Request:
- file: Document file (PDF, TXT, DOC, DOCX)

Response:
{
  "message": "Document processed successfully",
  "filename": "example.pdf",
  "chunks": 15
}
```

### Search
```http
POST /api/search
Content-Type: application/json

Request:
{
  "query": "What is machine learning?",
  "limit": 5
}

Response:
{
  "results": [
    {
      "text": "Machine learning is...",
      "score": 0.95,
      "metadata": { "filename": "ml-guide.pdf", "page": 1 }
    }
  ]
}
```

### RAG Query
```http
POST /api/rag-query
Content-Type: application/json

Request:
{
  "query": "Explain neural networks",
  "limit": 3
}

Response:
{
  "answer": "Neural networks are...",
  "sources": [
    {
      "text": "A neural network is...",
      "score": 0.92,
      "metadata": { "filename": "ai-basics.pdf" }
    }
  ]
}
```

### Health Check
```http
GET /api/health

Response:
{
  "status": "healthy",
  "qdrant": "connected",
  "timestamp": "2025-10-15T10:30:00Z"
}
```

## 📁 Project Structure

```
unthinkable-solutions/
├── public/
│   ├── index.html          # Main UI
│   ├── app.js              # Frontend logic
│   └── styles.css          # Styling
├── services/
│   ├── compressionService.js    # Text compression utilities
│   ├── documentProcessor.js     # Document parsing & chunking
│   ├── embeddingService.js      # Vector embedding generation
│   ├── qdrantService.js         # Qdrant database operations
│   └── ragService.js            # RAG implementation
├── uploads/                # Temporary file storage
├── .env                    # Environment variables
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies
├── server.js              # Express server
└── README.md              # This file
```

## 🧠 How It Works

### 1. Document Upload & Processing
```
Document Upload → Parse Content → Split into Chunks → Generate Embeddings → Store in Qdrant
```

### 2. Search & Retrieval
```
User Query → Generate Query Embedding → Vector Search in Qdrant → Return Top-K Results
```

### 3. RAG (Retrieval-Augmented Generation)
```
User Question → Retrieve Relevant Chunks → Build Context → Send to Gemini → Generate Answer
```

### Key Components

- **Document Processor**: Extracts text from various file formats and splits into manageable chunks
- **Embedding Service**: Converts text to 384-dimensional vectors using transformer models
- **Qdrant Service**: Manages vector storage and similarity search
- **RAG Service**: Combines retrieval with generative AI for contextual answers

## 🔍 Advanced Features

### Chunking Strategy
- **Chunk Size**: 1000 characters (configurable)
- **Overlap**: 200 characters to maintain context
- **Smart Splitting**: Respects sentence boundaries

### Embedding Model
- **Model**: `Xenova/all-MiniLM-L6-v2`
- **Dimensions**: 384
- **Max Tokens**: 512
- **Performance**: Fast inference on CPU

### Vector Search
- **Similarity Metric**: Cosine similarity
- **Top-K**: Configurable result count
- **Score Threshold**: 0.7 (default)

## 🧪 Testing

Run connection tests:
```bash
npm test
```

Check model availability:
```bash
node check-models.js
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Qdrant](https://qdrant.tech/) - Vector database
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI model
- [Hugging Face](https://huggingface.co/) - Transformer models
- [Xenova Transformers](https://huggingface.co/Xenova) - JavaScript ML library

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for intelligent document search**
