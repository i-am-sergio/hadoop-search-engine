// src/controller/wordController.js
import { getWordCounts } from '../services/hiveService.js';

export const getWords = async (req, res) => {
  try {
    const result = await getWordCounts();
    res.json(result);
  } catch (error) {
    console.error("Error getting words:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
