import express from 'express';
import { getHDFSFileContent } from '../controllers/hdfs.controller.js';

const router = express.Router();

router.get('/file', getHDFSFileContent); // GET /hdfs/file

export default router;
