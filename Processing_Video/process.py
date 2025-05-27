#!/usr/bin/env python3
"""process.py"""

import cv2
from ultralytics import YOLO
import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
import subprocess
import sys
import random

# === CONFIGURACIÓN ===
local_model_path = "/tmp/yolov8n.pt"
hdfs_model_path = "/models/yolov8n.pt"

if not os.path.exists(local_model_path):
    print(f"Copiando modelo desde HDFS {hdfs_model_path} a local {local_model_path}")
    subprocess.run(["hdfs", "dfs", "-copyToLocal", hdfs_model_path, local_model_path], check=True)

MODEL_PATH = local_model_path
FPS_ANALYSIS = 1
ciudades_arequipa = [
        "Arequipa Centro",
        "Yanahuara",
        "Cayma",
        "José Luis Bustamante y Rivero",
        "Sabandía"
    ]
model = YOLO(MODEL_PATH)

# === Procesamiento principal ===
def analyze_video(video_path):
    filename = os.path.basename(video_path)

    camera_id = random.randint(0, 5)
    location = random.choice(ciudades_arequipa)
    date = datetime.now().strftime("%Y-%m-%d")

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps * FPS_ANALYSIS)
    base_time = datetime.strptime(date + " 00:00:00", "%Y-%m-%d %H:%M:%S")

    frame_index = 0
    frames_to_analyze = []

    print("Cargando frames para detección...")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_index % frame_interval == 0:
            frames_to_analyze.append((frame_index, frame.copy()))

        frame_index += 1

    cap.release()

    print(f"Procesando {len(frames_to_analyze)} frames por lotes...")
    batch_size=1
    counts_by_hour = defaultdict(lambda: defaultdict(int))
    random_hour = random.randint(0, 23)
    start_hour_str = f"{random_hour:02d}:00"
    end_hour = (random_hour + 1) % 24
    end_hour_str = f"{end_hour:02d}:00"
    hour_slot = f"{start_hour_str}-{end_hour_str}"
    for i in range(0, len(frames_to_analyze), batch_size):
        batch = frames_to_analyze[i:i+batch_size]
        frames_batch = [f[1] for f in batch]
        try:
            detections = model(frames_batch, verbose=False)
            for (_, _), result in zip(batch, detections):
                for det in result.boxes.data.tolist():
                    cls_id = int(det[5])
                    cls_name = model.names[cls_id]
                    counts_by_hour[hour_slot][cls_name] += 1
        except Exception as e:
            print(f"⚠️  Error procesando lote desde frame {batch[0][0]}: {e}", file=sys.stderr)
            continue

    output = {
        "camera_id": camera_id,
        "location": location,
        "priority": "alta",
        "video_file": filename,
        "date": date,
        "timeslots": [
            {
                "hour": hour,
                "object_counts": dict(counts_by_hour[hour])
            } for hour in sorted(counts_by_hour)
        ],
        "alerts": []
    }

    return output

def save_custom_json(path, key, data):
    with open(path, "w", encoding="utf-8") as f:
        f.write(f'"{key}": ')
        json.dump(data, f, indent=4, ensure_ascii=False)
        f.write("\n")

def run_mapper():
    for line in sys.stdin:
        video_hdfs = line.strip()
        if not video_hdfs:
            continue
        try:
            print(f"Procesando video: {video_hdfs}", file=sys.stderr)
            local_video = "/tmp/" + os.path.basename(video_hdfs)
            if os.path.exists(local_video):
                os.remove(local_video)
            subprocess.run(["hdfs", "dfs", "-copyToLocal", video_hdfs, local_video], check=True)

            result = analyze_video(local_video)

            json_basename = os.path.splitext(os.path.basename(video_hdfs))[0] + ".json"
            local_json = "/tmp/" + json_basename
            json_hdfs = "/output/" + json_basename

            save_custom_json(local_json, json_basename, result)

            subprocess.run(["hdfs", "dfs", "-copyFromLocal", "-f", local_json, json_hdfs], check=True)
            print(f"JSON guardado en HDFS: {json_hdfs}", file=sys.stderr)

            os.remove(local_video)
            os.remove(local_json)

        except Exception as e:
            print(f"Error procesando {video_hdfs}: {e}", file=sys.stderr)

def main():
    # Para pruebas locales, llama: python process_video.py --local <ruta_video_local> <ruta_json_local>
    if len(sys.argv) == 4 and sys.argv[1] == "--local":
        video_path = sys.argv[2]
        json_path = sys.argv[3]

        print(f"Modo local: analizar video {video_path} y guardar JSON en {json_path}")
        result = analyze_video(video_path)

        # Clave = nombre del video con extensión .json (ej: "09152008flight2tape1_10.json")
        video_basename = os.path.basename(video_path)
        json_key = os.path.splitext(video_basename)[0] + ".json"

        save_custom_json(json_path, json_key, result)
        print(f"✅ JSON generado localmente: {json_path}")
        return

    # Modo normal (con HDFS)
    if len(sys.argv) == 2:
        video_hdfs = sys.argv[1]
        video_basename = os.path.basename(video_hdfs)
        json_basename = os.path.splitext(video_basename)[0] + ".json"
        json_hdfs = "/output/" + json_basename

        local_video = "/tmp/" + video_basename
        local_json = "/tmp/" + json_basename
        if os.path.exists(local_video):
            os.remove(local_video)
        subprocess.run(["hdfs", "dfs", "-copyToLocal", video_hdfs, local_video], check=True)
        result = analyze_video(local_video)

        video_basename = os.path.basename(local_video)
        save_custom_json(local_json, json_basename, result)
        
        subprocess.run(["hdfs", "dfs", "-copyFromLocal", "-f", local_json, json_hdfs], check=True)
        print(f"JSON guardado en HDFS: {json_hdfs}")
        os.remove(local_video)
        os.remove(local_json)
        return

    run_mapper()

if __name__ == "__main__":
    main()