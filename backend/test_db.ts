import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Database connected successfully!');
    const count = await prisma.company.count();
    console.log(`Current company count: ${count}`);
  } catch (e) {
    console.error('Database connection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
