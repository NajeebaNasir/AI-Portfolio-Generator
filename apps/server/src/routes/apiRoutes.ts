import { Router } from 'express';
import multer from 'multer';
import { ResumeController } from '../controllers/resumeController';
import { PortfolioController } from '../controllers/portfolioController';

const router = Router();

// Multer in-memory storage configuration (safe, 5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Resume endpoints
router.post('/resume/parse', upload.single('resume'), ResumeController.parseResume);
router.post('/resume/regenerate-section', ResumeController.regenerateSection);

// Portfolio generation & export endpoints
router.post('/portfolio/generate-and-validate', PortfolioController.generateAndValidate);
router.post('/portfolio/download-zip', PortfolioController.downloadZip);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'portfolio-generator-backend',
  });
});

export default router;
