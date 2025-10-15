require('dotenv').config();
const { QdrantClient } = require('@qdrant/js-client-rest');
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🧪 Testing Knowledge Base RAG Engine Connections...\n');

async function testQdrant() {
  console.log('1️⃣ Testing Qdrant Connection...');
  try {
    const client = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });

    const collections = await client.getCollections();
    console.log('✅ Qdrant connected successfully!');
    console.log(`   Collections: ${collections.collections.map(c => c.name).join(', ') || 'None'}`);
    return true;
  } catch (error) {
    console.error('❌ Qdrant connection failed:', error.message);
    return false;
  }
}

async function testGemini() {
  console.log('\n2️⃣ Testing Google Gemini Connection...');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });

    const result = await model.generateContent('Say "Hello from Gemini!" in exactly 4 words.');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini connected successfully!');
    console.log(`   Response: ${text.trim()}`);
    return true;
  } catch (error) {
    console.error('❌ Gemini connection failed:', error.message);
    return false;
  }
}

async function testEmbeddings() {
  console.log('\n3️⃣ Testing Embedding Model...');
  try {
    console.log('   Loading Transformers.js model (first run may take a moment)...');
    
    // Use dynamic import for ES Module
    const { pipeline } = await import('@xenova/transformers');
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    const output = await embedder('Test embedding', { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data);
    
    console.log('✅ Embedding model loaded successfully!');
    console.log(`   Embedding dimension: ${embedding.length}`);
    return true;
  } catch (error) {
    console.error('❌ Embedding model failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const results = {
    qdrant: await testQdrant(),
    gemini: await testGemini(),
    embeddings: await testEmbeddings()
  };

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 Test Summary:');
  console.log(`   Qdrant:     ${results.qdrant ? '✅' : '❌'}`);
  console.log(`   Gemini:     ${results.gemini ? '✅' : '❌'}`);
  console.log(`   Embeddings: ${results.embeddings ? '✅' : '❌'}`);

  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Your RAG engine is ready to use.');
    console.log('   Run: npm start');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your configuration.');
    console.log('   Make sure your .env file has correct credentials.');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runTests();
