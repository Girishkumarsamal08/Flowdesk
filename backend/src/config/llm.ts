import { ChatGroq } from '@langchain/groq';
import { ChatOpenAI } from '@langchain/openai';

export function getLLM() {
  if (process.env.OPENAI_API_KEY) {
    console.log('Using OpenAI (GPT-4o) as primary AI...');
    return new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o',
      temperature: 0.4,
    });
  }
  console.log('Using Groq (Llama-3.3) as AI...');
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.4,
  });
}
