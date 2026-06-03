import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SimpleMemoryVectorStore {
  documents: any[] = [];

  addDocuments(docs: any[]) {
    this.documents.push(...docs);
  }

  similaritySearch(query: string, k: number = 3) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) {
      return this.documents.slice(0, k);
    }

    const scoredDocs = this.documents.map(doc => {
      const contentLower = doc.pageContent.toLowerCase();
      let matches = 0;
      queryWords.forEach(word => {
        if (contentLower.includes(word)) {
          matches++;
        }
      });
      const score = matches / queryWords.length;
      return { doc, score };
    });

    scoredDocs.sort((a, b) => b.score - a.score);
    return scoredDocs.filter(s => s.score > 0).slice(0, k).map(s => s.doc);
  }
}

// Global registry of vector stores mapping companyId -> SimpleMemoryVectorStore
export const companyVectorStores: Record<string, SimpleMemoryVectorStore> = {};

// Helper to load company policies from DB into vector stores on demand
export async function ensureVectorStoreLoaded(companyId: string) {
  if (!companyVectorStores[companyId]) {
    companyVectorStores[companyId] = new SimpleMemoryVectorStore();
    
    const docs = await prisma.kBDocument.findMany({
      where: { companyId }
    });

    docs.forEach(doc => {
      const paragraphs = doc.content
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 20);

      const items = paragraphs.map(p => ({
        pageContent: p,
        metadata: { source: doc.fileName, docId: doc.id }
      }));

      companyVectorStores[companyId].addDocuments(items);
    });
    
    console.log(`Initialized vector store for company ${companyId} with ${docs.length} files.`);
  }
  return companyVectorStores[companyId];
}
