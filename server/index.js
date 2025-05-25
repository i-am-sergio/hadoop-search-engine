import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio donde se encuentran los videos
const VIDEO_DIR = path.join(__dirname, 'uploads');

// Página HTML estática (opcional)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de streaming: http://localhost:5000/video/1.mp4
app.get('/video/:filename', (req, res) => {
  const { filename } = req.params;

  // Seguridad: evita que accedan fuera del directorio 'uploads'
  const safePath = path.normalize(path.join(VIDEO_DIR, filename));
  if (!safePath.startsWith(VIDEO_DIR)) {
    return res.status(400).send('Acceso no permitido.');
  }

  if (!fs.existsSync(safePath)) {
    return res.status(404).send('Archivo no encontrado.');
  }

  const range = req.headers.range;
  if (!range) {
    return res.status(400).send("Se requiere el encabezado Range");
  }

  const videoSize = fs.statSync(safePath).size;
  const CHUNK_SIZE = 1 * 1e6; // 1MB

  const start = Number(range.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE - 1, videoSize - 1);
  const contentLength = end - start + 1;

  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': 'video/mp4',
    'Content-Disposition': `inline; filename="${filename}"`,
  };

  res.writeHead(206, headers);

  const videoStream = fs.createReadStream(safePath, { start, end });
  videoStream.pipe(res);
});

// Servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
