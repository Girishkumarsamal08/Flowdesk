import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import companyRoutes from './routes/company.js';
import chatRoutes from './routes/chat.js';

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Flowdesk Backend API is running' });
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/companies', companyRoutes);
app.use('/api', chatRoutes);

app.listen(port as number, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
