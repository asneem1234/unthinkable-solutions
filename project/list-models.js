// List all available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  try {
    console.log('Checking API Key and Available Models...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');
    console.log('');
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in .env file');
      process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    console.log('Fetching list of available models...');
    console.log('');
    
    // Make a direct API call to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Details:', errorText);
      console.log('');
      console.log('Possible issues:');
      console.log('1. Invalid API key');
      console.log('2. API key not enabled for Gemini API');
      console.log('3. API key expired or revoked');
      console.log('');
      console.log('Get a new API key from: https://aistudio.google.com/apikey');
      process.exit(1);
    }
    
    const data = await response.json();
    
    if (!data.models || data.models.length === 0) {
      console.log('❌ No models available for this API key');
      console.log('Your API key may not have access to Gemini models');
      process.exit(1);
    }
    
    console.log('✅ Available models:');
    console.log('');
    
    for (const model of data.models) {
      console.log(`  📦 ${model.name}`);
      if (model.displayName) {
        console.log(`     Name: ${model.displayName}`);
      }
      if (model.description) {
        console.log(`     Description: ${model.description.substring(0, 80)}...`);
      }
      console.log('');
    }
    
    // Find generateContent-capable models
    const genModels = data.models.filter(m => 
      m.supportedGenerationMethods && 
      m.supportedGenerationMethods.includes('generateContent')
    );
    
    if (genModels.length > 0) {
      console.log('✅ Models that support text generation:');
      genModels.forEach(m => console.log(`   - ${m.name}`));
      console.log('');
      console.log(`💡 Recommended: Use "${genModels[0].name}" in your code`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

listModels();
