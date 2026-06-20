import { Router } from 'express';
import * as controller from '../controllers/ai.controller.js';

export const aiRouter = Router();

// POST /api/ai/chat  — lähetä viesti AI-assistentille, saa vastaus
// GET  /api/ai/history/:sessionId — hae keskusteluhistoria
aiRouter.post('/chat', controller.chat);
aiRouter.get('/history/:sessionId', controller.getHistory);
