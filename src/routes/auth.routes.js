import { Router } from 'express';

import { login, logout, me } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
