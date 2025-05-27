#!/usr/bin/env python3
"""holacopy.py"""

import sys
import socket

for line in sys.stdin:
    video = line.strip()
    # Guarda el video en un archivo local para que el daemon lo procese
    with open("/tmp/videos_a_procesar.txt", "a") as f:
        f.write(video + "\n")
    print(f"Hola mundo desde nodo {socket.gethostname()} with {video}")
