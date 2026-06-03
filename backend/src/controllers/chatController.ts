import { PrismaClient } from '@prisma/client';
import chatService from '../services/chatService.js';

const prisma = new PrismaClient();

export class ChatController {
  async chat(req: any, res: any) {
    try {
      const companyId = req.companyId;
      const { customerEmail, message } = req.body;

      if (!customerEmail || !message) {
        return res.status(400).json({ message: 'Customer email and message required' });
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      const result = await chatService.processChat(companyId, customerEmail, message, company);

      const chatMessage = await prisma.chatMessage.create({
        data: {
          companyId,
          customerEmail,
          customerMessage: message,
          aiResponse: result.response,
          category: result.classification.category,
          confidence: result.classification.confidence,
        },
      });

      res.json({
        message: 'Chat processed',
        classification: result.classification,
        response: result.response,
        customerValid: result.validation.valid,
        chatId: chatMessage.id,
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async getChatHistory(req: any, res: any) {
    try {
      const companyId = req.companyId;
      const { customerEmail } = req.query;

      if (!customerEmail) {
        return res.status(400).json({ message: 'Customer email required' });
      }

      const messages = await prisma.chatMessage.findMany({
        where: {
          companyId,
          customerEmail: customerEmail as string,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json({ messages });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

export default new ChatController();
