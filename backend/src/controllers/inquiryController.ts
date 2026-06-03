import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InquiryController {
  // Get all inquiries/chats for a company
  async getAllInquiries(req: any, res: any) {
    try {
      const companyId = req.companyId;
      const { page = 1, limit = 10, status } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = { companyId };
      if (status) {
        where.status = status;
      }

      const inquiries = await prisma.inquiry.findMany({
        where,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      });

      const total = await prisma.inquiry.count({ where });

      res.json({
        message: 'Inquiries retrieved successfully',
        data: inquiries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // Get inquiry by ID with all messages
  async getInquiryById(req: any, res: any) {
    try {
      const { inquiryId } = req.params;
      const companyId = req.companyId;

      const inquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!inquiry || inquiry.companyId !== companyId) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }

      res.json({
        message: 'Inquiry retrieved successfully',
        inquiry,
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // Update inquiry status
  async updateInquiryStatus(req: any, res: any) {
    try {
      const { inquiryId } = req.params;
      const { status } = req.body;
      const companyId = req.companyId;

      if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const inquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId },
      });

      if (!inquiry || inquiry.companyId !== companyId) {
        return res.status(404).json({ message: 'Inquiry not found' });
      }

      const updated = await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { status },
      });

      res.json({ message: 'Inquiry status updated', inquiry: updated });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // Get inquiries by customer email
  async getInquiriesByCustomer(req: any, res: any) {
    try {
      const companyId = req.companyId;
      const { customerEmail } = req.query;

      if (!customerEmail) {
        return res.status(400).json({ message: 'Customer email is required' });
      }

      const inquiries = await prisma.inquiry.findMany({
        where: {
          companyId,
          customerEmail: customerEmail as string,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        message: 'Customer inquiries retrieved successfully',
        data: inquiries,
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // Get company dashboard stats
  async getCompanyDashboard(req: any, res: any) {
    try {
      const companyId = req.companyId;

      const [company, totalChats, totalDocuments, recentChats, chatsByStatus, chatsByCategory] =
        await Promise.all([
          prisma.company.findUnique({
            where: { id: companyId },
            select: {
              companyName: true,
              category: true,
              email: true,
              createdAt: true,
            },
          }),
          prisma.chatMessage.count({ where: { companyId } }),
          prisma.kBDocument.count({ where: { companyId } }),
          prisma.chatMessage.findMany({
            where: { companyId },
            select: {
              id: true,
              customerEmail: true,
              category: true,
              confidence: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
          prisma.inquiry.groupBy({
            by: ['status'],
            where: { companyId },
            _count: true,
          }),
          prisma.chatMessage.groupBy({
            by: ['category'],
            where: { companyId },
            _count: true,
          }),
        ]);

      const statusStats = chatsByStatus.map(item => ({
        status: item.status,
        count: item._count,
      }));

      const categoryStats = chatsByCategory.map(item => ({
        category: item.category,
        count: item._count,
      }));

      res.json({
        message: 'Dashboard data retrieved successfully',
        dashboard: {
          company,
          metrics: {
            totalChats,
            totalDocuments,
          },
          recentChats,
          statusDistribution: statusStats,
          categoryDistribution: categoryStats,
        },
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

export default new InquiryController();
