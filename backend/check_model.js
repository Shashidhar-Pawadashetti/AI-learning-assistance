import fetch from 'node-fetch';

const model = 'openai/gpt-oss-120b';
console.log(`Testing existence of model: ${model}`);

try {
  // Try to fetch model info from HF API
  const response = await fetch(`https://huggingface.co/api/models/${model}`);
  if (response.status === 200) {
    console.log("✅ Model found!");
  } else {
    console.log(`❌ Model not found (Status: ${response.status})`);
  }
} catch (error) {
  console.error("Error:", error.message);
}
