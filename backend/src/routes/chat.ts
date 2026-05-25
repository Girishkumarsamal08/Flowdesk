import express from 'express';
import { ChatGroq } from '@langchain/groq';
import { ChatOpenAI } from '@langchain/openai';
import { PrismaClient, Prisma } from '@prisma/client';
import { ensureVectorStoreLoaded } from './company.js';

const prisma = new PrismaClient();
const router = express.Router();

// AI Provider Selection
const getLLM = () => {
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
};

// ============================================================
// STAGE 2: Issue Classification
// ============================================================
async function classifyIssue(message: string): Promise<{ category: string; confidence: number }> {
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

// ============================================================
// STAGE 1: Customer Validation via Company API
// ============================================================
async function validateCustomer(
  customerEmail: string,
  company: any
): Promise<{ valid: boolean; customerData: any | null }> {
  if (!company.apiBaseUrl) {
    return { valid: true, customerData: null }; // No API configured, skip validation
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (company.apiAuthType === 'bearer' && company.apiAuthToken) {
      headers['Authorization'] = `Bearer ${company.apiAuthToken}`;
    } else if (company.apiAuthType === 'api_key' && company.apiAuthToken) {
      headers['X-API-Key'] = company.apiAuthToken;
    }

    // Merge custom headers
    if (company.apiHeaders && typeof company.apiHeaders === 'object') {
      Object.assign(headers, company.apiHeaders);
    }

    const url = `${company.apiBaseUrl}/customer?email=${encodeURIComponent(customerEmail)}`;
    const resp = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });

    if (resp.ok) {
      const data = await resp.json();
      return { valid: true, customerData: data };
    }
    return { valid: false, customerData: null };
  } catch (err) {
    console.log('Customer validation API unavailable, proceeding without:', err);
    return { valid: true, customerData: null };
  }
}

// ============================================================
// STAGE 4: Live API Decision Engine
// ============================================================
async function executeRelevantAPIs(
  category: string,
  customerEmail: string,
  company: any,
  inquiryId: string
): Promise<{ apiResults: Record<string, any>; apiCallTrace: any[] }> {
  const apiResults: Record<string, any> = {};
  const apiCallTrace: any[] = [];

  if (!company.apiBaseUrl) {
    return { apiResults, apiCallTrace };
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (company.apiAuthType === 'bearer' && company.apiAuthToken) {
    headers['Authorization'] = `Bearer ${company.apiAuthToken}`;
  } else if (company.apiAuthType === 'api_key' && company.apiAuthToken) {
    headers['X-API-Key'] = company.apiAuthToken;
  }
  if (company.apiHeaders && typeof company.apiHeaders === 'object') {
    Object.assign(headers, company.apiHeaders);
  }

  // Map categories to the data mappings
  const mappings: Record<string, string> = company.dataMappings || {};

  // Determine which APIs to call based on classification
  const categoryToMappingKeys: Record<string, string[]> = {
    bandwidth_exceeded: ['Bandwidth Usage', 'Membership Tier', 'Customer Profile'],
    website_down: ['Service Health', 'Bandwidth Usage', 'Customer Profile'],
    billing_issue: ['Invoices', 'Customer Profile'],
    refund_request: ['Orders', 'Customer Profile'],
    upgrade_request: ['Membership Tier', 'Customer Profile'],
    subscription_issue: ['Membership Tier', 'Customer Profile'],
    order_issue: ['Orders', 'Customer Profile'],
    order_tracking: ['Tracking', 'Orders'],
    login_issue: ['Customer Profile'],
    api_quota_exceeded: ['Bandwidth Usage', 'Membership Tier'],
    service_restart: ['Service Health', 'Customer Profile'],
    password_reset: ['Customer Profile'],
    general_inquiry: ['Customer Profile'],
  };

  const keysToFetch = categoryToMappingKeys[category] || ['Customer Profile'];

  for (const key of keysToFetch) {
    const endpoint = mappings[key];
    if (!endpoint) continue;

    const url = `${company.apiBaseUrl}${endpoint}?email=${encodeURIComponent(customerEmail)}`;
    const startTime = Date.now();

    try {
      const resp = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
      const data = resp.ok ? await resp.json() : { error: `HTTP ${resp.status}` };
      const statusCode = resp.status;

      apiResults[key] = data;
      apiCallTrace.push({
        key, endpoint, method: 'GET', url,
        statusCode, responseTime: Date.now() - startTime,
        response: data,
      });

      // Log to DB
      await prisma.aPICallLog.create({
        data: {
          companyId: company.id,
          inquiryId,
          endpoint,
          method: 'GET',
          requestBody: { email: customerEmail },
          responseBody: data === null ? Prisma.JsonNull : (data as Prisma.InputJsonValue),
          statusCode,
        }
      });
    } catch (err: any) {
      apiCallTrace.push({
        key, endpoint, method: 'GET', url,
        statusCode: 0, error: err.message,
        responseTime: Date.now() - startTime,
      });
    }
  }

  return { apiResults, apiCallTrace };
}

// ============================================================
// STAGE 5: Resolution Engine
// ============================================================
async function generateResolution(
  message: string,
  category: string,
  policyContext: string,
  apiResults: Record<string, any>,
  customerData: any,
  company: any
): Promise<{ reply: string; actions: any[]; confidence: number }> {
  const llm = getLLM();

  const apiSummary = Object.keys(apiResults).length > 0
    ? Object.entries(apiResults).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')
    : 'No API data available.';

  const customerSummary = customerData
    ? `Customer Profile: ${JSON.stringify(customerData)}`
    : 'Customer profile not available via API.';

  const resolutionPrompt = `You are a professional AI customer support agent for "${company.companyName}" (${company.category} company).

CORE RULES:
1. Be concise and direct. No excessive greetings.
2. Use the policy context and live API data to resolve the issue.
3. If you cannot confidently resolve, say so clearly and mention a human specialist will assist.
4. NEVER fabricate data. Only use what is provided below.
5. If relevant, suggest an action the customer can take (upgrade, reset password, retry payment, etc.).

ISSUE CATEGORY: ${category}

CUSTOMER INFO:
${customerSummary}

COMPANY KNOWLEDGE BASE (Policies & Rules):
${policyContext || 'No policy documents available.'}

LIVE API DATA:
${apiSummary}

CUSTOMER MESSAGE: "${message}"

Respond with a helpful, professional resolution. If the data shows specific conditions (e.g., limit_reached=true, tier=free), reference them directly.
At the end of your response, on a new line, output available actions in this JSON format (or empty array if none):
ACTIONS: [{"label": "Action Label", "type": "link|api_call", "url": "url_or_endpoint"}]`;

  try {
    const response = await llm.invoke(resolutionPrompt);
    const text = typeof response.content === 'string' ? response.content : String(response.content);

    let reply = text;
    let actions: any[] = [];

    // Extract actions from the response
    const actionsMatch = text.match(/ACTIONS:\s*(\[[\s\S]*?\])/);
    if (actionsMatch) {
      try {
        actions = JSON.parse(actionsMatch[1]);
        reply = text.substring(0, text.indexOf('ACTIONS:')).trim();
      } catch { /* ignore parse errors */ }
    }

    // Estimate confidence based on data availability
    let confidence = 0.5;
    if (Object.keys(apiResults).length > 0) confidence += 0.2;
    if (policyContext && policyContext.length > 50) confidence += 0.2;
    if (customerData) confidence += 0.1;
    confidence = Math.min(confidence, 1.0);

    return { reply, actions, confidence };
  } catch (err: any) {
    console.error('Resolution engine error:', err);
    return {
      reply: "I apologize, but I'm experiencing a temporary issue generating a response. A support specialist will be connected to assist you shortly.",
      actions: [],
      confidence: 0.1
    };
  }
}

// ============================================================
// ESCALATION LOGIC
// ============================================================
function shouldEscalate(confidence: number, turnCount: number, sentiment: string, apiAvailable: boolean): boolean {
  if (confidence < 0.3) return true;
  if (turnCount >= (parseInt(process.env.ESCALATION_REPLY_THRESHOLD || '5'))) return true;
  if (sentiment === 'negative') return true;
  if (!apiAvailable && confidence < 0.5) return true;
  return false;
}

// ============================================================
// MAIN CHAT ENDPOINT - Full Orchestration Pipeline
// ============================================================
router.post('/chat', async (req, res) => {
  try {
    const { companyId, email, subject, message } = req.body;

    if (!companyId || !message) {
      return res.status(400).json({ error: 'Missing companyId or message' });
    }

    if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'AI API Key missing. Set GROQ_API_KEY or OPENAI_API_KEY.' });
    }

    console.log(`\n========== AI ORCHESTRATION PIPELINE ==========`);
    console.log(`Company: ${companyId} | Customer: ${email || 'anonymous'}`);

    // Fetch company with all configs
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Find or create inquiry
    let inquiry = await prisma.inquiry.findFirst({
      where: {
        companyId,
        email: email || 'anonymous@unknown.com',
        status: { in: ['pending', 'escalated'] }
      },
      include: { messages: true }
    });

    if (!inquiry) {
      inquiry = await prisma.inquiry.create({
        data: {
          companyId,
          email: email || 'anonymous@unknown.com',
          subject: subject || message.substring(0, 100),
          status: 'pending',
        },
        include: { messages: true }
      });
    }

    // Save customer message
    await prisma.message.create({
      data: {
        inquiryId: inquiry.id,
        sender: 'customer',
        content: message,
      }
    });

    const turnCount = inquiry.messages.filter(m => m.sender === 'customer').length + 1;

    // ---- STAGE 1: Customer Validation ----
    console.log(`[Stage 1] Validating customer: ${email}`);
    const { valid, customerData } = await validateCustomer(email || '', company);
    console.log(`[Stage 1] Customer valid: ${valid}, data: ${customerData ? 'found' : 'none'}`);

    // ---- STAGE 2: Issue Classification ----
    console.log(`[Stage 2] Classifying issue...`);
    const { category, confidence: classificationConfidence } = await classifyIssue(message);
    console.log(`[Stage 2] Category: ${category}, Confidence: ${classificationConfidence}`);

    // ---- STAGE 3: Policy Retrieval (RAG) ----
    console.log(`[Stage 3] Retrieving policies from KB...`);
    const vectorStore = await ensureVectorStoreLoaded(companyId);
    const kbResults = vectorStore.similaritySearch(message, 3);
    const policyContext = kbResults.map(r => r.pageContent).join('\n\n---\n\n');
    console.log(`[Stage 3] Retrieved ${kbResults.length} policy chunks`);

    // ---- STAGE 4: Live API Decision Engine ----
    console.log(`[Stage 4] Executing relevant APIs...`);
    const { apiResults, apiCallTrace } = await executeRelevantAPIs(
      category, email || '', company, inquiry.id
    );
    console.log(`[Stage 4] API calls completed: ${apiCallTrace.length}`);

    const apiAvailable = apiCallTrace.length > 0 && apiCallTrace.some(t => t.statusCode >= 200 && t.statusCode < 400);

    // ---- ESCALATION CHECK ----
    const sentiment = inquiry.sentiment || 'neutral';
    const needsEscalation = shouldEscalate(classificationConfidence, turnCount, sentiment, apiAvailable);

    if (needsEscalation && inquiry.status !== 'escalated') {
      console.log(`[Escalation] Triggered — confidence: ${classificationConfidence}, turns: ${turnCount}`);

      await prisma.inquiry.update({
        where: { id: inquiry.id },
        data: { status: 'escalated', confidence: classificationConfidence }
      });

      const escalationMsg = "We're connecting you with a specialist. A support executive will join shortly to assist you.";

      await prisma.message.create({
        data: {
          inquiryId: inquiry.id,
          sender: 'ai',
          content: escalationMsg,
        }
      });

      // Log the reasoning
      await prisma.aIReasoningLog.create({
        data: {
          inquiryId: inquiry.id,
          retrievedChunks: kbResults.map(r => r.pageContent),
          confidenceScore: classificationConfidence,
          classification: category,
          decisionReason: `Escalated: confidence=${classificationConfidence}, turns=${turnCount}, sentiment=${sentiment}, apiAvailable=${apiAvailable}`,
          apiCallTrace: apiCallTrace,
        }
      });

      return res.json({
        reply: escalationMsg,
        status: 'escalated',
        inquiryId: inquiry.id,
        actions: [],
        reasoning: {
          category,
          confidence: classificationConfidence,
          retrievedChunks: kbResults.length,
          apiCalls: apiCallTrace.length,
          escalationReason: 'Low confidence or high turn count'
        }
      });
    }

    // ---- STAGE 5: Resolution Engine ----
    console.log(`[Stage 5] Generating AI resolution...`);
    const { reply, actions, confidence } = await generateResolution(
      message, category, policyContext, apiResults, customerData, company
    );
    console.log(`[Stage 5] Resolution generated. Confidence: ${confidence}`);

    // Save AI response message
    await prisma.message.create({
      data: {
        inquiryId: inquiry.id,
        sender: 'ai',
        content: reply,
      }
    });

    // Update inquiry
    await prisma.inquiry.update({
      where: { id: inquiry.id },
      data: {
        status: confidence >= 0.6 ? 'resolved_ai' : 'pending',
        confidence,
        sentiment,
      }
    });

    // Log reasoning trace
    await prisma.aIReasoningLog.create({
      data: {
        inquiryId: inquiry.id,
        retrievedChunks: kbResults.map(r => r.pageContent),
        confidenceScore: confidence,
        classification: category,
        decisionReason: `Resolved with confidence=${confidence}. Category=${category}. API data available=${apiAvailable}. Policy chunks=${kbResults.length}.`,
        apiCallTrace: apiCallTrace,
      }
    });

    console.log(`========== PIPELINE COMPLETE ==========\n`);

    res.json({
      reply,
      status: confidence >= 0.6 ? 'resolved_ai' : 'pending',
      inquiryId: inquiry.id,
      actions,
      reasoning: {
        category,
        confidence,
        retrievedChunks: kbResults.length,
        apiCalls: apiCallTrace.length,
        policySnippets: kbResults.map(r => r.pageContent.substring(0, 100) + '...'),
        apiSummary: Object.keys(apiResults),
      }
    });
  } catch (error: any) {
    console.error('Chat Orchestration Error:', error);
    res.status(500).json({ error: 'AI orchestration error', details: error.message });
  }
});

// @route   GET /api/inquiries/:id/reasoning
// @desc    Get AI reasoning logs for an inquiry (Observability)
router.get('/inquiries/:id/reasoning', async (req, res) => {
  try {
    const logs = await prisma.aIReasoningLog.findMany({
      where: { inquiryId: req.params.id },
      orderBy: { timestamp: 'desc' }
    });

    const apiLogs = await prisma.aPICallLog.findMany({
      where: { inquiryId: req.params.id },
      orderBy: { timestamp: 'desc' }
    });

    const messages = await prisma.message.findMany({
      where: { inquiryId: req.params.id },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ reasoningLogs: logs, apiCallLogs: apiLogs, messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST /api/executive/reply
// @desc    Executive manually replies to a ticket
router.post('/executive/reply', async (req, res) => {
  try {
    const { inquiryId, content } = req.body;
    if (!inquiryId || !content) {
      return res.status(400).json({ error: 'Missing inquiryId or content' });
    }

    await prisma.message.create({
      data: {
        inquiryId,
        sender: 'human',
        content,
      }
    });

    res.json({ message: 'Executive reply sent successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
