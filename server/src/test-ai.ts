import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import OpenAI from 'openai';

const apiKey = process.env.AI_API_KEY;
const baseURL = process.env.AI_BASE_URL;
const model = process.env.AI_MODEL ?? 'gpt-4o-mini';

console.log('--- AI Config ---');
console.log('Model    :', model);
console.log('Base URL :', baseURL || '(default OpenAI)');
console.log('API Key  :', apiKey ? `${apiKey.slice(0, 10)}...` : 'MISSING');
console.log('-----------------\n');

if (!apiKey) {
  console.error('ERROR: No API key found. Set AI_API_KEY in .env');
  process.exit(1);
}

const client = new OpenAI({
  apiKey,
  ...(baseURL ? { baseURL } : {}),
});

(async () => {
  try {
    console.log('Sending test prompt to', model, '...');
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Reply with exactly: "AI connection successful"' }],
      temperature: 0,
    });
    const text = response.choices[0]?.message?.content;
    console.log('\nResponse:', text);
    console.log('\nSUCCESS - AI is working correctly.');
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string; code?: string };
    console.error('\nFAILED');
    console.error('Status :', e.status);
    console.error('Code   :', e.code);
    console.error('Message:', e.message);
  }
})();
