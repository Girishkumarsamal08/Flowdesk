import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
async function main() {
  const companies = await prisma.company.findMany({
    include: { inquiries: true }
  });
  console.log(JSON.stringify(companies, null, 2));
  await prisma.$disconnect();
}
main();
