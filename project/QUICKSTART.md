# Quick Start Guide - REFRAG RAG System

## 🎯 5-Minute Setup

Follow these steps to get the REFRAG RAG System running in just 5 minutes!

### Step 1: Prerequisites Check ✅

Make sure you have:
- ✓ Node.js v18+ installed ([Download](https://nodejs.org/))
- ✓ Python 3.8+ installed ([Download](https://www.python.org/downloads/))
- ✓ Gemini API Key ([Get one free](https://makersuite.google.com/app/apikey))

### Step 2: Install Dependencies 📦

**Windows (PowerShell):**
```powershell
cd project
.\setup.ps1
```

**Linux/Mac (Bash):**
```bash
cd project
chmod +x setup.sh
./setup.sh
```

**Or manually:**
```bash
npm install
pip install chromadb
```

### Step 3: Configure API Key 🔑

Edit the `.env` file:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

Replace `your_actual_api_key_here` with your real Gemini API key.

### Step 4: Start ChromaDB Server 🗄️

**Open a NEW terminal** and run:
```bash
chroma run --host localhost --port 8000
```

Keep this terminal running. You should see:
```
Running Chroma
Chroma Server Version: 0.x.x
```

### Step 5: Start the Application 🚀

**In your original terminal**, run:
```bash
npm start
```

You'll see:
```
🚀 REFRAG RAG System Starting...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Server running on port 3000
✓ Frontend: http://localhost:3000
✓ API: http://localhost:3000/api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 6: Open the Web Interface 🌐

Open your browser and navigate to:
```
http://localhost:3000
```

## 🎮 First Query in 3 Steps

### 1. Upload a Document
- Click the upload area or drag & drop a PDF/TXT file
- Click "Upload Files"
- Wait for confirmation ✓

### 2. Ask a Question
- Select "REFRAG Compressed" mode (recommended)
- Type your question, for example:
  ```
  What are the main topics discussed in this document?
  ```
- Click "Query" or press Ctrl+Enter

### 3. View Results
- See the AI-generated answer
- Check metrics: tokens, latency, compression ratio
- Compare with baseline by selecting "Compare Both" mode

## 🎯 Example Use Cases

### Use Case 1: Research Paper Analysis
```
1. Upload: research_paper.pdf
2. Query: "What is the main contribution of this paper?"
3. Mode: REFRAG Compressed
4. Result: Fast answer with 60% fewer tokens
```

### Use Case 2: Document Comparison
```
1. Upload: multiple PDFs
2. Query: "Compare the methodologies across all documents"
3. Mode: Compare Both
4. Result: Side-by-side baseline vs compressed performance
```

### Use Case 3: Technical Documentation
```
1. Upload: user_manual.pdf
2. Query: "How do I configure the system?"
3. Mode: REFRAG Compressed
4. Result: Accurate answer with reduced cost
```

## 🔧 Troubleshooting Common Issues

### Issue 1: ChromaDB Not Found
```
Error: Connection refused to localhost:8000
```
**Solution:** Start ChromaDB server in a separate terminal:
```bash
chroma run --host localhost --port 8000
```

### Issue 2: Gemini API Error
```
Error: Invalid API key
```
**Solution:** Check your `.env` file:
1. Open `.env`
2. Verify `GEMINI_API_KEY` is set correctly
3. Get a new key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Issue 3: Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution:** 
- Change port in `.env`: `PORT=3001`
- Or kill the process using port 3000

### Issue 4: File Upload Fails
```
Error: File upload failed
```
**Solution:**
- Check file size < 50MB
- Verify format is PDF or TXT
- Ensure `uploads/` directory exists and is writable

## 📊 Understanding the Results

### Metrics Explained

| Metric | Description | Good Value |
|--------|-------------|------------|
| **Tokens Used** | Number of tokens sent to LLM | Lower is better |
| **Retrieval Time** | Time to search documents | < 500ms |
| **Generation Time** | Time for LLM to respond | < 2000ms |
| **Total Time** | End-to-end latency | < 2500ms |
| **Compression Ratio** | Token reduction % | 60-80% |

### Query Modes

#### 🚀 REFRAG Compressed (Recommended)
- **Use when:** You want faster, cheaper queries
- **Benefits:** 60% fewer tokens, 2x faster, lower cost
- **Trade-off:** Minimal quality loss (~1-2%)

#### 📄 Baseline RAG
- **Use when:** You want maximum quality
- **Benefits:** No compression, full context
- **Trade-off:** Slower, more expensive

#### 🔀 Compare Both
- **Use when:** You want to see the difference
- **Benefits:** Side-by-side comparison with metrics
- **Trade-off:** Takes longer (runs both modes)

## 🎓 Best Practices

### 1. Document Preparation
- Use clear, well-formatted PDFs
- Break large documents into smaller files
- Remove unnecessary pages (covers, blank pages)

### 2. Query Writing
- Be specific and clear
- Ask one question at a time
- Include relevant context in your query

### 3. Performance Optimization
- Use REFRAG Compressed for most queries
- Reserve Baseline for critical queries
- Regularly clear old documents you don't need

### 4. Cost Management
- Monitor total tokens in metrics panel
- Use compressed mode to reduce costs
- Delete unused documents

## 🚀 Advanced Features

### Custom Configuration

Edit `utils/refragEngine.js` to customize:
```javascript
const TOP_K = 10;              // Chunks to retrieve (default: 10)
const TOP_UNCOMPRESSED = 3;    // Uncompressed chunks (default: 3)
const FUSION_ALPHA = 0.7;      // Dense weight (default: 0.7)
```

### API Integration

Use the REST API directly:
```javascript
// Upload document
const formData = new FormData();
formData.append('document', file);
const response = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
});

// Query
const response = await fetch('http://localhost:3000/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    query: 'Your question here',
    mode: 'compressed'
  })
});
```

## 📈 Performance Expectations

### Typical Performance (10 Documents, 500 chunks)

| Operation | Time | Notes |
|-----------|------|-------|
| Upload PDF (10 pages) | 2-5s | Includes parsing and indexing |
| Retrieval (10 chunks) | 300-500ms | ChromaDB search + BM25 |
| Compression | 100-200ms | Gemini summarization |
| Answer Generation | 1000-2000ms | Gemini Pro |
| **Total Query Time** | **1500-2500ms** | End-to-end |

### Token Usage (Average)

| Mode | Input Tokens | Output Tokens | Total Cost* |
|------|--------------|---------------|-------------|
| Baseline | ~4000 | ~150 | $0.0061 |
| Compressed | ~1600 | ~150 | $0.0025 |
| **Savings** | **60%** | **Same** | **59%** |

*Based on Gemini Pro pricing: $0.00025/1K input, $0.001/1K output

## 🎯 Next Steps

Now that you're set up:

1. **📚 Read the Full Documentation**: See `README.md` for detailed info
2. **🏗️ Understand the Architecture**: Check `METHODOLOGY_AND_ARCHITECTURE.md`
3. **🔬 Read the Research**: Review `refrag.pdf` for the theory
4. **💻 Customize**: Modify the code to fit your needs
5. **🚀 Deploy**: Consider cloud deployment for production

## 💡 Tips & Tricks

### Speed Up Queries
- Keep documents focused and relevant
- Delete old documents you don't need
- Use compressed mode by default
- Limit query length to necessary information

### Improve Answer Quality
- Upload high-quality, well-formatted documents
- Ask specific, well-formulated questions
- Include context in your questions
- Use baseline mode for critical queries

### Reduce Costs
- Always use compressed mode unless quality is critical
- Monitor token usage in metrics panel
- Delete test documents after experimentation
- Batch similar queries together

## 🆘 Need Help?

- **Documentation**: See `README.md` for full details
- **API Reference**: Check API endpoints in README
- **Issues**: Report bugs on GitHub
- **Research**: Read `METHODOLOGY_AND_ARCHITECTURE.md`

## ✅ Quick Checklist

Before asking for help, verify:
- [ ] ChromaDB server is running
- [ ] Gemini API key is set in `.env`
- [ ] Node.js dependencies installed (`npm install`)
- [ ] ChromaDB installed (`pip install chromadb`)
- [ ] Port 3000 is available
- [ ] Browser can access `http://localhost:3000`

---

**🎉 You're Ready to Go!**

Start uploading documents and asking questions. The system will handle the rest!

**Happy Querying! 🚀**
