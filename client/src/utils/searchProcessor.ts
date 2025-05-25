// src/utils/searchProcessor.ts
import { cocoNames, translationTable } from "./cocoData";

export function extractCocoClassesFromText(inputText: string): string[] {
  const palabras = inputText.toLowerCase().replace(/[.,!?]/g, "").split(/\s+/);

  const resultado: Set<string> = new Set();

  for (const palabra of palabras) {
    const traduccion = translationTable[palabra];
    if (traduccion && cocoNames.includes(traduccion)) {
      resultado.add(traduccion);
    }
  }

  return Array.from(resultado);
}