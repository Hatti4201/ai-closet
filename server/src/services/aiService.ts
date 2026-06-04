import OpenAI from 'openai';

let client: OpenAI | null = null;

const getClient = (): OpenAI => {
  if (!client) {
    const apiKey = process.env.AI_API_KEY;
    const options: ConstructorParameters<typeof OpenAI>[0] = { apiKey };
    if (process.env.AI_BASE_URL) options.baseURL = process.env.AI_BASE_URL;
    client = new OpenAI(options);
  }
  return client;
};

export const callAI = async (prompt: string): Promise<string> => {
  const model = process.env.AI_MODEL ?? 'gpt-4o-mini';
  const openai = getClient();
  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content ?? '';
};
