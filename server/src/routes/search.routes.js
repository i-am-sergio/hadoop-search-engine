import { Router } from 'express';
import { basicSearch } from '../controllers/search.controller.js';

const router = Router();

// GET /search?q=person&car&bus
router.get('/', basicSearch);

export default router;