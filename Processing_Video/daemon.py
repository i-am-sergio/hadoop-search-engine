#!/usr/bin/env python3
import time
import subprocess
import os

archivo_videos = "/tmp/videos_a_procesar.txt"
procesados = set()

while True:
    if os.path.exists(archivo_videos):
        with open(archivo_videos, "r") as f:
            videos = [line.strip() for line in f if line.strip()]

        for video in videos:
            if video not in procesados:
                print(f"Procesando {video}")
                # Ejecuta process.py localmente
                subprocess.run(['python3', 'process.py', video])
                procesados.add(video)

    time.sleep(5)  # Espera 5 segundos antes de revisar otra vez
