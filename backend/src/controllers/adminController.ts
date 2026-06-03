import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminController {
  // Get all registered companies with pagination & search
  async getAllCompanies(req: any, res: any) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (search) {
        where.OR = [
          { companyName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { domain: { contains: search, mode: 'insensitive' } },
        ];
      }

      const companies = await prisma.company.findMany({
        where,
        select: {
          id: true,
          email: true,
          companyName: true,
          category: true,
          domain: true,
          supportEmail: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              kbDocuments: true,
              inquiries: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      });

      const total = await prisma.company.count({ where });

      res.json({
        message: 'Companies retrieved successfully',
        data: companies,
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

  // Get company by ID with full details
  async getCompanyById(req: any, res: any) {
    try {
      const { companyId } = req.params;

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          kbDocuments: {
            select: {
              id: true,
              fileName: true,
              fileType: true,
              createdAt: true,
            },
          },
          inquiries: {
            select: {
              id: true,
              customerEmail: true,
              subject: true,
              status: true,
              createdAt: true,
              messages: {
                take: 1,
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      res.json({ message: 'Company details retrieved', company });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // Get company statistics/analytics
  async getCompanyStats(req: any, res: any) {
    try {
      const { companyId } = req.params;

      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      const [totalDocuments, totalChats, totalCustomers, chatsByCategory] = await Promise.all([
        prisma.kBDocument.count({ where: { companyId } }),
        prisma.chatMessage.count({ where: { companyId } }),
        prisma.chatMessage.findMany({
          where: { companyId },
          distinct: ['customerEmail'],
          select: { customerEmail: true },
        }),
        prisma.chatMessage.groupBy({
          by: ['category'],
          where: { companyId },
          _count: {
            category: true,
          },
        }),
      ]);

      const categoryStats = chatsByCategory.map(item => ({
        category: item.category,
        count: item._count.category,
      }));

      res.json({
        message: 'Company statistics retrieved',
        stats: {
          companyName: company.companyName,
          category: company.category,
          totalDocuments,
          totalChats,
          totalCustomers: totalCustomers.length,
          chatsByCategory: categoryStats,
          createdAt: company.createdAt,
        },
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // Delete a company
  async deleteCompany(req: any, res: any) {
    try {
      const { companyId } = req.params;

      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Delete all related data
      await Promise.all([
        prisma.kBDocument.deleteMany({ where: { companyId } }),
        prisma.chatMessage.deleteMany({ where: { companyId } }),
        prisma.inquiry.deleteMany({ where: { companyId } }),
        prisma.company.delete({ where: { id: companyId } }),
      ]);

      res.json({ message: 'Company and all associated data deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // Get platform statistics
  async getPlatformStats(req: any, res: any) {
    try {
      const [totalCompanies, totalChats, totalDocuments, companiesByCategory] = await Promise.all([
        prisma.company.count(),
        prisma.chatMessage.count(),
        prisma.kBDocument.count(),
        prisma.company.groupBy({
          by: ['category'],
          _count: {
            category: true,
          },
        }),
      ]);

      const categoryBreakdown = companiesByCategory.map(item => ({
        category: item.category,
        count: item._count.category,
      }));

      res.json({
        message: 'Platform statistics retrieved',
        stats: {
          totalCompanies,
          totalChats,
          totalDocuments,
          companiesByCategory: categoryBreakdown,
        },
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

export default new AdminController();
