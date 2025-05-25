import { streamVideoService } from '../services/video.services.js';

export const streamVideo = async (req, res) => {
  try {
    const { filename } = req.params;
    const range = req.headers.range;

    if (!range) {
      return res.status(400).send("Se requiere el encabezado Range");
    }

    await streamVideoService(filename, range, res);
  } catch (error) {
    if (error.message === 'Acceso no permitido') {
      return res.status(400).send('Acceso no permitido.');
    }
    if (error.message === 'Archivo no encontrado') {
      return res.status(404).send('Archivo no encontrado.');
    }
    console.error(error);
    res.status(500).send('Error al procesar el video');
  }
};