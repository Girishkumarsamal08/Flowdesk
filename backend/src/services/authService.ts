import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { JWT_SECRET, JWT_EXPIRY } from '../config/constants.js';

const prisma = new PrismaClient();

export class AuthService {
  async registerCompany(email: string, password: string, companyName: string, category: string) {
    // Check if company already exists
    const existing = await prisma.company.findUnique({ where: { email } });
    if (existing) {
      throw new Error('Company already registered with this email');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create company
    const company = await prisma.company.create({
      data: {
        email,
        passwordHash,
        companyName,
        category,
      },
    });

    return company;
  }

  async loginCompany(email: string, password: string) {
    const company = await prisma.company.findUnique({ where: { email } });
    if (!company) {
      throw new Error('Company not found');
    }

    const isPasswordValid = await bcrypt.compare(password, company.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign({ id: company.id, email: company.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    return { company, token };
  }

  async updateCompanyConfig(companyId: string, updates: any) {
    return prisma.company.update({
      where: { id: companyId },
      data: updates,
    });
  }
}

export default new AuthService();
