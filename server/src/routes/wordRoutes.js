// src/routes/wordRoutes.js
import express from 'express';
import { getWords } from '../controllers/wordController.js';

const router = express.Router();

router.get('/words', getWords);

export default router;
