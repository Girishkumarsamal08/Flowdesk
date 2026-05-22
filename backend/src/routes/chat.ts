import express from 'express';
import { OllamaEmbeddings } from '@langchain/ollama';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { DynamicTool } from '@langchain/core/tools';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// AI Provider Selection Helper
const getLLM = () => {
  if (process.env.OPENAI_API_KEY) {
    console.log('Using OpenAI (GPT-4o) as primary AI...');
    return new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o',
      temperature: 0.7,
    });
  }
  console.log('Using Groq (Llama-3.3) as AI...');
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
  });
};

// Custom In-Memory Vector Store for robust prototype testing
class SimpleMemoryVectorStore {
  documents: { pageContent: string; embedding: number[]; metadata?: any }[] = [];
  constructor(private embeddings: OllamaEmbeddings) {}

  async addDocuments(docs: { pageContent: string; metadata?: any }[]) {
    for (const doc of docs) {
      try {
        // Embeddings still use Ollama (local) or we could use another service. 
        // For now, we keep local embeddings but with a much shorter timeout.
        const embedding = await Promise.race([
          this.embeddings.embedQuery(doc.pageContent),
          new Promise<number[]>((_, reject) => setTimeout(() => reject(new Error('Embedding timeout')), 10000))
        ]);
        this.documents.push({ pageContent: doc.pageContent, embedding, metadata: doc.metadata });
      } catch (err) {
        console.log('💡 AI Knowledge Base: Using local indexing (Ollama is warming up...)');
        // Fallback to empty embedding for prototype survival
        this.documents.push({ pageContent: doc.pageContent, embedding: new Array(768).fill(0), metadata: doc.metadata });
      }
    }
  }

  async similaritySearch(query: string, k: number = 2) {
    try {
      const queryEmbedding = await Promise.race([
        this.embeddings.embedQuery(query),
        new Promise<number[]>((_, reject) => setTimeout(() => reject(new Error('Embedding timeout')), 5000))
      ]);
      const scoredDocs = this.documents.map(doc => {
        let dotProduct = 0, normA = 0, normB = 0;
        for (let i = 0; i < queryEmbedding.length; i++) {
          dotProduct += queryEmbedding[i] * doc.embedding[i];
          normA += queryEmbedding[i] * queryEmbedding[i];
          normB += doc.embedding[i] * doc.embedding[i];
        }
        const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        return { doc, score };
      });
      scoredDocs.sort((a, b) => b.score - a.score);
      return scoredDocs.slice(0, k).map(s => s.doc);
    } catch (e) {
      // If embeddings fail, return recent docs as context
      return this.documents.slice(-k).map(d => d);
    }
  }
}

// Mock database for Vector Store (in-memory per company)
export const companyVectorStores: Record<string, SimpleMemoryVectorStore> = {};
export const embeddings = new OllamaEmbeddings({ 
  model: 'nomic-embed-text',
  baseUrl: 'http://localhost:11434',
});

export async function addToKnowledgeBase(companyId: string, text: string) {
  try {
    if (!companyVectorStores[companyId]) {
      companyVectorStores[companyId] = new SimpleMemoryVectorStore(embeddings);
    }
    
    // We don't await this in the main route to prevent timeouts
    companyVectorStores[companyId].addDocuments([{
      pageContent: text,
      metadata: { source: 'automated_sync', date: new Date().toISOString() }
    }]);
    return true;
  } catch (error) {
    console.error('Error adding to knowledge base:', error);
    return false;
  }
}

// ==========================================
// Phase 2: RAG / Knowledge Base Endpoint
// ==========================================
router.post('/knowledge-base', async (req, res) => {
  try {
    const { companyId, text } = req.body;
    if (!companyId || !text) {
      return res.status(400).json({ error: 'Missing companyId or text' });
    }

    if (!companyVectorStores[companyId]) {
      companyVectorStores[companyId] = new SimpleMemoryVectorStore(embeddings);
    }
    
    // Non-blocking update
    companyVectorStores[companyId].addDocuments([{
      pageContent: text,
      metadata: { source: 'company_upload', date: new Date().toISOString() }
    }]);

    res.json({ message: 'Knowledge base is being updated in the background', success: true });
  } catch (error: any) {
    console.error('KB Error:', error);
    res.status(500).json({ error: error.message || 'Failed to update KB' });
  }
});

// ==========================================
// Phase 3: Integration (Mock Logistic API)
// ==========================================
const mockOrders: Record<string, any> = {
  '123': { status: 'Shipped', carrier: 'FedEx', trackingNumber: 'FX-987654321', expectedDelivery: 'Tomorrow' },
  '555': { status: 'Processing', carrier: 'UPS', trackingNumber: 'Pending', expectedDelivery: 'In 3 days' },
  '789': { status: 'Delivered', carrier: 'DHL', trackingNumber: 'DH-12345', expectedDelivery: 'Yesterday' }
};

router.get('/orders/:id', (req, res) => {
  const order = mockOrders[req.params.id];
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Langchain Tool for Order Tracking
const trackOrderTool = new DynamicTool({
  name: "track_order",
  description: "Use this tool to track a customer's order. Pass the order ID (like '123' or '555') as the input.",
  func: async (orderId: string) => {
    const order = mockOrders[orderId.trim()];
    if (order) {
      return `Order ${orderId} status: ${order.status}. Carrier: ${order.carrier}, Expected Delivery: ${order.expectedDelivery}.`;
    }
    return `Order ${orderId} not found in the system.`;
  },
});

// ==========================================
// Phase 4: Chatbot Endpoint
// ==========================================
router.post('/chat', async (req, res) => {
  try {
    const { companyId, message } = req.body;
    if (!companyId || !message) {
      return res.status(400).json({ error: 'Missing companyId or message' });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("CRITICAL: GROQ_API_KEY is missing from environment!");
      return res.status(500).json({ error: 'AI API Key missing' });
    }
    
    console.log(`Chat request received for company ${companyId}`);
    let context = "No specific company knowledge available.";
    
    if (!companyVectorStores[companyId]) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (company) {
        const policyText = [company.companyPolicy, company.refundPolicy].filter(Boolean).join('\n\n');
        if (policyText) {
          await addToKnowledgeBase(companyId, policyText);
        }
      }
    }

    if (companyVectorStores[companyId]) {
      const results = await companyVectorStores[companyId].similaritySearch(message, 2);
      if (results.length > 0) {
        context = results.map(r => r.pageContent).join('\n\n');
      }
    }

    // Use selected AI provider (OpenAI primary, Groq fallback)
    const llm = getLLM();

    let injectedToolContext = "";
    const orderMatch = message.match(/(?:order\s*#?)\s*(\d+)/i);
    if (orderMatch) {
       const toolResult = await trackOrderTool.func(orderMatch[1]);
       injectedToolContext = `\n\nTOOL RESULT (Order Lookup for ${orderMatch[1]}): ${toolResult}`;
    }

    const finalPrompt = `
SYSTEM: You are a professional and concise customer support agent. 
Your personality is:
- **Direct & Efficient**: Provide clear, straight-to-the-point answers. Avoid excessive small talk or long-winded greetings.
- **Professional**: Maintain a polite but formal tone.
- **Concise**: Keep responses short and impactful. Only provide necessary information.

CORE RULES:
1. **Be Concise**: Do not write more than needed. Get straight to the answer.
2. **Knowledge Base**: Use the information below to answer questions about the company.
3. **Out-of-Scope**: If the query isn't in the knowledge base, provide a brief, professional suggestion or offer to connect them to a human team.

COMPANY KNOWLEDGE BASE:
${context}

TOOLS CONTEXT:
${injectedToolContext}

USER QUERY: ${message}
`;

    const response = await llm.invoke(finalPrompt);
    res.json({ reply: response.content });

  } catch (error: any) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: 'AI service error', details: error.message });
  }
});

export default router;
