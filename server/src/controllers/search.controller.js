import { performBasicSearch } from '../services/search.service.js';

export const basicSearch = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ error: 'Parámetro "q" es requerido.' });
    }

    const entities = query.split(',').map(e => e.trim()).filter(Boolean);

    if (entities.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron entidades válidas.' });
    }

    const results = await performBasicSearch(entities);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al realizar la búsqueda.' });
  }
};
