import { basicSearchService, advancedSearchService } from '../services/search.service.js';

export const basicSearch = async (req, res) => {
  try {
    const { q, limit, offset } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'El parámetro "q" es requerido' });
    }

    const results = await basicSearchService(q, parseInt(limit) || 10, parseInt(offset) || 0);
    res.json(results);
  } catch (error) {
    console.error('Error en búsqueda básica:', error);
    res.status(500).json({ error: 'Error al procesar la búsqueda' });
  }
};


export const advancedSearch = async (req, res) => {
  try {
    const { entities, logic, date_range, duration } = req.body;
    
    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      return res.status(400).json({ error: 'El campo "entities" es requerido y debe ser un array' });
    }

    const results = await advancedSearchService({
      entities,
      logic: logic || 'AND',
      date_range,
      duration
    });

    res.json(results);
  } catch (error) {
    console.error('Error en búsqueda avanzada:', error);
    res.status(500).json({ error: 'Error al procesar la búsqueda avanzada' });
  }
};