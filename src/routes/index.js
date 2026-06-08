import { Router } from 'express';
import authRoutes from './auth.routes.js';
import painelRoutes from './painel.routes.js';
import { listaProdutosPublicos, criaLead } from '../controllers/public.controller.js';

const router = Router();

router.use('/api/auth', authRoutes);
router.use('/painel', painelRoutes);
router.get('/api/produtos',  listaProdutosPublicos);
router.post('/api/contato', criaLead);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
