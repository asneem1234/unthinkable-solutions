const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');

class DocumentProcessor {
  async extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      switch (ext) {
        case '.pdf':
          return await this.extractFromPDF(filePath);
        case '.txt':
          return await this.extractFromTXT(filePath);
        case '.doc':
        case '.docx':
          return await this.extractFromDOCX(filePath);
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }
    } catch (error) {
      console.error(`Error extracting text from ${filePath}:`, error);
      throw error;
    }
  }

  async extractFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  async extractFromTXT(filePath) {
    try {
      const text = await fs.readFile(filePath, 'utf-8');
      return text;
    } catch (error) {
      throw new Error(`Failed to read text file: ${error.message}`);
    }
  }

  async extractFromDOCX(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  chunkText(text, options = {}) {
    const {
      chunkSize = 512,
      chunkOverlap = 100,
      separator = '\n'
    } = options;

    // Clean the text
    const cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    if (cleanText.length === 0) {
      throw new Error('Document contains no text');
    }

    // Split into sentences
    const sentences = this.splitIntoSentences(cleanText);
    
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      // If adding this sentence exceeds chunk size
      if ((currentChunk + ' ' + sentence).length > chunkSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          
          // Create overlap by keeping last part of current chunk
          const words = currentChunk.split(' ');
          const overlapWords = Math.floor(words.length * (chunkOverlap / chunkSize));
          currentChunk = words.slice(-overlapWords).join(' ');
        }
      }
      
      currentChunk += ' ' + sentence;
    }
    
    // Add the last chunk
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    // Filter out very small chunks
    const filteredChunks = chunks.filter(chunk => chunk.length >= 50);
    
    console.log(`Created ${filteredChunks.length} chunks from text of length ${cleanText.length}`);
    
    return filteredChunks;
  }

  splitIntoSentences(text) {
    // Split by common sentence endings
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0);
    
    return sentences;
  }

  // Alternative chunking strategy: semantic chunking
  chunkBySemantic(text, maxChunkSize = 512) {
    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    const chunks = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + '\n\n' + para).length > maxChunkSize) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length >= 50);
  }

  extractMetadata(text) {
    return {
      characterCount: text.length,
      wordCount: text.split(/\s+/).length,
      lineCount: text.split('\n').length,
    };
  }
}

module.exports = new DocumentProcessor();
