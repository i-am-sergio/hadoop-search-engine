import { Router } from 'express';
import { streamVideo } from '../controllers/video.controller.js';

const router = Router();

router.get('/:filename', streamVideo);

export default router;