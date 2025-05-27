import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import videoRoutes from './routes/video.routes.js';
import searchRoutes from './routes/search.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuración básica
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Directorio público
app.use(express.static(path.join(__dirname, '../public')));

// Rutas
app.use('/video', videoRoutes);
app.use('/api/search', searchRoutes); 

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).send('Recurso no encontrado');
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal!');
});

export default app;