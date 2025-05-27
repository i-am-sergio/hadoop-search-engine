import { Router } from 'express';
import { basicSearch, advancedSearch } from '../controllers/search.controller.js';

const router = Router();

router.get('/', basicSearch);
router.post('/advanced', advancedSearch);

export default router;