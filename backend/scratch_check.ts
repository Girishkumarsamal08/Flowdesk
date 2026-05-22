import { Prisma } from '@prisma/client';

type CompanyCreate = Prisma.CompanyCreateInput;

const check: CompanyCreate = {
  email: 'test@test.com',
  passwordHash: 'hash',
  companyName: 'test',
  category: 'test',
  companyPolicy: 'test',
  infoUrl: 'test',
  refundPolicy: 'test',
};

console.log('Type check done');
