import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEO_PATH = path.join(__dirname, 'uploads', '1.mp4');
// const VIDEO_PATH = path.join(__dirname, 'uploads', '09152008flight2tape1_1.mpg');

// Página HTML
app.use(express.static(path.join(__dirname, 'public')));

// Ruta que entrega el video por streaming
app.get('/video', (req, res) => {
  const range = req.headers.range;
  if (!range) {
    return res.status(400).send("Requiere el encabezado Range");
  }

  const videoSize = fs.statSync(VIDEO_PATH).size;

  // Ejemplo de rango: "bytes=0-999999"
  const CHUNK_SIZE = 1 * 1e6; // 1MB por fragmento (ajustable)
  const start = Number(range.replace(/\D/g, ''));
  const end = Math.min(start + CHUNK_SIZE - 1, videoSize - 1);

  const contentLength = end - start + 1;

  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    // 'Content-Type': 'video/mpeg',
    // 'Content-Disposition': 'inline; filename="09152008flight2tape1_1.mpg"',
    'Content-Type': 'video/mp4',
    'Content-Disposition': 'inline; filename="1.mp4"',
  };

  res.writeHead(206, headers);
  const videoStream = fs.createReadStream(VIDEO_PATH, { start, end });
  videoStream.pipe(res);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
