import { PrismaClient, Prisma } from '@prisma/client';
import { getLLM } from '../config/llm.js';
import { ensureVectorStoreLoaded } from '../utils/vectorStore.js';

const prisma = new PrismaClient();

export class ChatService {
  async classifyIssue(message: string): Promise<any> {
    const llm = getLLM();
    const classificationPrompt = `You are an issue classification engine. Classify the following customer support message into EXACTLY ONE category.

CATEGORIES:
- bandwidth_exceeded
- website_down
- billing_issue
- refund_request
- upgrade_request
- login_issue
- api_quota_exceeded
- subscription_issue
- order_issue
- order_tracking
- password_reset
- service_restart
- general_inquiry

Also provide a confidence score from 0.0 to 1.0.

Customer message: "${message}"

Respond in EXACTLY this JSON format, nothing else:
{"category": "<category>", "confidence": <score>}`;

    try {
      const response = await llm.invoke(classificationPrompt);
      const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return { category: parsed.category || 'general_inquiry', confidence: parsed.confidence || 0.5 };
      }
    } catch (err) {
      console.error('Classification error:', err);
    }
    return { category: 'general_inquiry', confidence: 0.3 };
  }

  async validateCustomer(
    customerEmail: string,
    company: any
  ): Promise<any> {
    if (!company.apiBaseUrl) {
      return { valid: true, customerData: null };
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (company.apiAuthType === 'bearer' && company.apiAuthToken) {
        headers['Authorization'] = `Bearer ${company.apiAuthToken}`;
      } else if (company.apiAuthType === 'api_key' && company.apiAuthToken) {
        headers['X-API-Key'] = company.apiAuthToken;
      }

      if (company.apiHeaders && typeof company.apiHeaders === 'object') {
        Object.assign(headers, company.apiHeaders);
      }

      const url = `${company.apiBaseUrl}/customer?email=${encodeURIComponent(customerEmail)}`;
      const resp = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });

      if (resp.ok) {
        const data = await resp.json();
        return { valid: true, customerData: data };
      }
    } catch (err) {
      console.error('Customer validation error:', err);
    }
    return { valid: false, customerData: null };
  }

  async processChat(
    companyId: string,
    customerEmail: string,
    customerMessage: string,
    company: any
  ) {
    // Classify the issue
    const classification = await this.classifyIssue(customerMessage);

    // Validate customer
    const validation = await this.validateCustomer(customerEmail, company);

    // Load vector store for this company
    const vectorStore = await ensureVectorStoreLoaded(companyId);

    // Get relevant documents
    const relevantDocs = vectorStore.similaritySearch(customerMessage, 3);

    // Generate response using LLM
    const llm = getLLM();
    const systemPrompt = `You are a helpful customer support AI for ${company.companyName}. 
Issue Category: ${classification.category}
Customer Valid: ${validation.valid}

${relevantDocs.length > 0 ? `Relevant Company Information:\n${relevantDocs.map(d => d.pageContent).join('\n\n')}` : ''}`;

    const response = await llm.invoke(systemPrompt + `\n\nCustomer: ${customerMessage}`);
    
    return {
      classification,
      validation,
      response: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
      relevantDocCount: relevantDocs.length,
    };
  }
}

export default new ChatService();
