import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes/apiRoutes';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/api', apiRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    name: 'AI Portfolio Generator Agent API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      parseResume: 'POST /api/resume/parse',
      regenerateSection: 'POST /api/resume/regenerate-section',
      generateAndValidate: 'POST /api/portfolio/generate-and-validate',
      downloadZip: 'POST /api/portfolio/download-zip',
    },
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Portfolio Generator API running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
