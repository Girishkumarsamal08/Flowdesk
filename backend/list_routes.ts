import 'dotenv/config';
import express from 'express';
import companyRoutes from './src/routes/company-new.js';
import chatRoutes from './src/routes/chat-new.js';
import adminRoutes from './src/routes.admin.js'; // fixed import if needed
import inquiryRoutes from './src/routes/inquiries.js';
import swaggerRoutes from './src/routes/swagger.js';
import mockCompanyRoutes from './src/routes/mock-company.js';

const app = express();
app.use('/api/companies', companyRoutes);
app.use('/api', chatRoutes);

function print(path, layer) {
  if (layer.route) {
    layer.route.stack.forEach(print.bind(null, path + layer.route.path));
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach(print.bind(null, path + (layer.regexp.source.replace('\\/?', '').replace('(?=\\/|$)', '').replace('^\\/', '').replace(/\\\//g, '/'))));
  } else if (layer.method) {
    console.log('%s /%s', layer.method.toUpperCase(), path.split('//').join('/'));
  }
}

app._router.stack.forEach(print.bind(null, ''));
