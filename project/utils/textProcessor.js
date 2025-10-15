const natural = require('natural');

class TextProcessor {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
  }

  // Split text into semantic chunks
  chunkText(text, chunkSize = 512, overlap = 100) {
    try {
      // Clean text
      const cleanedText = this.cleanText(text);
      
      // Split by paragraphs first
      const paragraphs = cleanedText.split(/\n\n+/);
      
      const chunks = [];
      let currentChunk = '';
      let currentTokenCount = 0;

      for (const paragraph of paragraphs) {
        const paragraphTokens = this.tokenizer.tokenize(paragraph);
        const paragraphTokenCount = paragraphTokens.length;

        // If paragraph is too large, split it
        if (paragraphTokenCount > chunkSize) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
            currentTokenCount = 0;
          }

          // Split large paragraph by sentences
          const sentences = paragraph.split(/\.\s+/);
          let tempChunk = '';
          let tempTokenCount = 0;

          for (const sentence of sentences) {
            const sentenceTokens = this.tokenizer.tokenize(sentence);
            const sentenceTokenCount = sentenceTokens.length;

            if (tempTokenCount + sentenceTokenCount > chunkSize) {
              if (tempChunk) {
                chunks.push(tempChunk.trim() + '.');
              }
              tempChunk = sentence;
              tempTokenCount = sentenceTokenCount;
            } else {
              tempChunk += (tempChunk ? '. ' : '') + sentence;
              tempTokenCount += sentenceTokenCount;
            }
          }

          if (tempChunk) {
            chunks.push(tempChunk.trim() + '.');
          }
        } else {
          // Check if adding this paragraph exceeds chunk size
          if (currentTokenCount + paragraphTokenCount > chunkSize) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            
            // Start new chunk with overlap
            if (chunks.length > 0 && overlap > 0) {
              const previousTokens = this.tokenizer.tokenize(chunks[chunks.length - 1]);
              const overlapTokens = previousTokens.slice(-overlap);
              currentChunk = overlapTokens.join(' ') + '\n\n' + paragraph;
              currentTokenCount = overlapTokens.length + paragraphTokenCount;
            } else {
              currentChunk = paragraph;
              currentTokenCount = paragraphTokenCount;
            }
          } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            currentTokenCount += paragraphTokenCount;
          }
        }
      }

      // Add the last chunk
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      console.log(`✓ Text split into ${chunks.length} chunks`);
      return chunks;
    } catch (error) {
      console.error('Error chunking text:', error);
      throw error;
    }
  }

  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\t/g, ' ')     // Replace tabs with spaces
      .replace(/ +/g, ' ')     // Multiple spaces to single space
      .replace(/\n{3,}/g, '\n\n')  // Multiple newlines to double
      .trim();
  }

  // Calculate BM25 score for relevance
  calculateBM25(query, documents) {
    try {
      const tokenizedQuery = this.tokenizer.tokenize(query.toLowerCase());
      const tokenizedDocs = documents.map(doc => 
        this.tokenizer.tokenize(doc.text.toLowerCase())
      );

      const avgDocLength = tokenizedDocs.reduce((sum, doc) => sum + doc.length, 0) / tokenizedDocs.length;
      const k1 = 1.5;
      const b = 0.75;

      // Calculate IDF for each query term
      const idf = {};
      tokenizedQuery.forEach(term => {
        const docsWithTerm = tokenizedDocs.filter(doc => doc.includes(term)).length;
        idf[term] = Math.log((tokenizedDocs.length - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1);
      });

      // Calculate BM25 score for each document
      const scores = documents.map((doc, idx) => {
        const tokenizedDoc = tokenizedDocs[idx];
        const docLength = tokenizedDoc.length;

        let score = 0;
        tokenizedQuery.forEach(term => {
          const termFreq = tokenizedDoc.filter(t => t === term).length;
          const numerator = termFreq * (k1 + 1);
          const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
          score += idf[term] * (numerator / denominator);
        });

        return {
          ...doc,
          bm25Score: score
        };
      });

      return scores.sort((a, b) => b.bm25Score - a.bm25Score);
    } catch (error) {
      console.error('Error calculating BM25:', error);
      return documents;
    }
  }

  // Combine dense and sparse scores
  fusionScore(denseScore, sparseScore, alpha = 0.7) {
    return alpha * denseScore + (1 - alpha) * sparseScore;
  }
}

module.exports = new TextProcessor();
