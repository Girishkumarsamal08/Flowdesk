/*
  Warnings:

  - You are about to drop the column `companyPolicy` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryMethod` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryPartner` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `goodsType` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `infoUrl` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `productGuide` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `refundPolicy` on the `Company` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Inquiry` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Inquiry" DROP CONSTRAINT "Inquiry_companyId_fkey";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "companyPolicy",
DROP COLUMN "deliveryMethod",
DROP COLUMN "deliveryPartner",
DROP COLUMN "goodsType",
DROP COLUMN "infoUrl",
DROP COLUMN "productGuide",
DROP COLUMN "refundPolicy",
ADD COLUMN     "apiAuthToken" TEXT,
ADD COLUMN     "apiAuthType" TEXT,
ADD COLUMN     "apiBaseUrl" TEXT,
ADD COLUMN     "apiHeaders" JSONB,
ADD COLUMN     "dataMappings" JSONB,
ADD COLUMN     "parsedEndpoints" JSONB,
ADD COLUMN     "supportEmail" TEXT,
ADD COLUMN     "swaggerSchema" TEXT;

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "sentiment" TEXT NOT NULL DEFAULT 'neutral',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "KBDocument" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KBDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APICallLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "inquiryId" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestBody" JSONB,
    "responseBody" JSONB,
    "statusCode" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "APICallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIReasoningLog" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "retrievedChunks" JSONB,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "classification" TEXT NOT NULL,
    "decisionReason" TEXT NOT NULL,
    "apiCallTrace" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIReasoningLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KBDocument" ADD CONSTRAINT "KBDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APICallLog" ADD CONSTRAINT "APICallLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APICallLog" ADD CONSTRAINT "APICallLog_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIReasoningLog" ADD CONSTRAINT "AIReasoningLog_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
