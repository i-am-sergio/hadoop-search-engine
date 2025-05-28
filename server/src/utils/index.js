import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Ruta absoluta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo de entidades
const filePath = path.join(__dirname, '../../data/part_r_00000.txt');

export const loadEntityToFileMap = async () => {
  const hashTable = {};

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(Boolean);

    for (const line of lines) {
      const [entity, ...rest] = line.trim().split(/\s+/);
      const filesStr = rest.join(' ');
      if (!entity || !filesStr) continue;

      const files = filesStr.split(',').map(f => f.trim());

      const key = entity.toLowerCase(); // insensible a mayúsculas
      if (!hashTable[key]) {
        hashTable[key] = new Set();
      }

      files.forEach(file => hashTable[key].add(file));
    }

    // Convertir sets a arrays
    for (const key in hashTable) {
      hashTable[key] = Array.from(hashTable[key]);
    }

    return hashTable;
  } catch (err) {
    console.error(`Error leyendo el archivo de entidades: ${err.message}`);
    return {};
  }
};
