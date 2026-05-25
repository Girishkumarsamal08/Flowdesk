import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import companyRoutes from './routes/company.js';
import chatRoutes from './routes/chat.js';
import swaggerRoutes from './routes/swagger.js';
import mockCompanyRoutes from './routes/mock-company.js';

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Flowdesk Backend API is running', version: '2.0.0' });
});

// Routes
app.use('/api/companies', companyRoutes);
app.use('/api', chatRoutes);
app.use('/api/swagger', swaggerRoutes);
app.use('/api/mock-company', mockCompanyRoutes);

app.listen(port as number, '0.0.0.0', () => {
  console.log(`\n🚀 Flowdesk AI Support OS — Server running on http://0.0.0.0:${port}`);
  console.log(`   Mock Company API: http://localhost:${port}/api/mock-company`);
  console.log(`   Health: http://localhost:${port}/health\n`);
});
