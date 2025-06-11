import { Router } from 'express';
import { streamVideo, streamHDFSVideo } from '../controllers/video.controller.js';

const router = Router();

router.get('/hdfs', streamHDFSVideo);
router.get('/:filename', streamVideo);

export default router;