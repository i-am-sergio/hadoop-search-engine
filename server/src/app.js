import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import videoRoutes from './routes/video.routes.js';
import searchRoutes from './routes/search.routes.js';
import hdfsRoutes from './routes/hdfs.routes.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuración básica
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())

// Directorio público
app.use(express.static(path.join(__dirname, '../public')));

// Rutas
app.use('/video', videoRoutes);
app.use('/search', searchRoutes); 
app.use('/hdfs', hdfsRoutes);

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