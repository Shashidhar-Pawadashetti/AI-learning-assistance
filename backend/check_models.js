import fetch from 'node-fetch';

const models = [
  'openai/gpt-oss-120b',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'meta-llama/Meta-Llama-3-8B-Instruct'
];

console.log('Checking models...');

for (const model of models) {
  try {
    const res = await fetch(`https://huggingface.co/api/models/${model}`);
    console.log(`${model}: ${res.status === 200 ? '✅ Available' : '❌ ' + res.status}`);
  } catch (e) {
    console.log(`${model}: Error ${e.message}`);
  }
}
