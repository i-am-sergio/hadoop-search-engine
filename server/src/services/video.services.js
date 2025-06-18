import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import webhdfs from "webhdfs";

const hdfsClient = webhdfs.createClient({
  user: "hadoop",
  host: "fedora",
  port: 9870,
  path: "/webhdfs/v1",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio donde se encuentran los videos
const VIDEO_DIR = path.join(__dirname, "../../uploads");

export const streamHDFSVideoService = (videoPathInHDFS, range, res) => {
  return new Promise((resolve, reject) => {
    console.log(videoPathInHDFS);
    if (!videoPathInHDFS || !videoPathInHDFS.startsWith("/videos/")) {
      reject(new Error("Ruta HDFS inválida"));
      return;
    }

    // HEAD request para obtener tamaño del video
    hdfsClient.stat(videoPathInHDFS, (err, status) => {
      if (err || !status || !status.length) {
        reject(new Error("Archivo no encontrado en HDFS"));
        return;
      }

      const videoSize = status.length;
      const CHUNK_SIZE = 1 * 1e6;
      const start = Number(range.replace(/\D/g, ""));
      const end = Math.min(start + CHUNK_SIZE - 1, videoSize - 1);
      const contentLength = end - start + 1;

      const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
        "Content-Disposition": `inline; filename="${videoPathInHDFS
          .split("/")
          .pop()}"`,
      };

      res.writeHead(206, headers);

      const streamOpts = { offset: start, length: contentLength };
      console.log(
        `Stream desde byte ${start} hasta ${end} (${videoSize} bytes totales)`
      );
      const hdfsStream = hdfsClient.createReadStream(
        videoPathInHDFS,
        streamOpts
      );

      hdfsStream.pipe(res);
      hdfsStream.on("end", () => resolve());
      hdfsStream.on("error", (err) => reject(err));
    });
  });
};

export const streamVideoService = (filename, range, res) => {
  return new Promise((resolve, reject) => {
    // Seguridad: evita que accedan fuera del directorio 'uploads'
    const safePath = path.normalize(path.join(VIDEO_DIR, filename));
    if (!safePath.startsWith(VIDEO_DIR)) {
      reject(new Error("Acceso no permitido"));
      return;
    }

    if (!fs.existsSync(safePath)) {
      reject(new Error("Archivo no encontrado"));
      return;
    }

    const videoSize = fs.statSync(safePath).size;
    const CHUNK_SIZE = 1 * 1e6; // 1MB

    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE - 1, videoSize - 1);
    const contentLength = end - start + 1;

    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
      "Content-Disposition": `inline; filename="${filename}"`,
    };

    res.writeHead(206, headers);

    const videoStream = fs.createReadStream(safePath, { start, end });
    videoStream.pipe(res);

    videoStream.on("end", () => resolve());
    videoStream.on("error", (err) => reject(err));
  });
};
