#!/usr/bin/env python3

from pyspark.sql import SparkSession, Row
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, ArrayType, MapType
import socket
import os
import subprocess
import sys
import traceback
import json
import cv2
from ultralytics import YOLO
from datetime import datetime
from collections import defaultdict
import random
import psutil

HDFS_BIN = "/home/hadoop/hadoop/bin/hdfs"
LOG_COPY_DIR = "/user/hadoop/videos_copy_log"
OUTPUT_CAKE_DIR = "/user/hadoop/videos_cake"
OUTPUT_JSON_DIR = "/user/hadoop/json_output"
HDFS_MODEL_PATH = "/models/yolov8n.pt"
LOCAL_MODEL_PATH = "/tmp/yolov8n.pt"


ciudades_usa = [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
    "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"
]

global_model = None
json_paths = []  # para guardar (name, path)

schema = StructType([
    StructField("video_name", StringType(), True),
    StructField("camera_id", IntegerType(), True),
    StructField("location", StringType(), True),
    StructField("priority", StringType(), True),
    #StructField("video_file", StringType(), True),
    StructField("date", StringType(), True),
    StructField("timeslots", ArrayType(
        StructType([
            StructField("hour", StringType(), True),
            StructField("object_counts", MapType(StringType(), IntegerType()), True)
        ])
    ), True),
    StructField("alerts", ArrayType(StringType()), True)
])

def convertir_a_row(res):
    return Row(
        video_name=res["video_file"],
        camera_id=res["camera_id"],
        location=res["location"],
        priority=res["priority"],
        date=res["date"],
        timeslots=[
            Row(
                hour=slot["hour"],
                object_counts=slot["object_counts"]
            )
            for slot in res["timeslots"]
        ],
        alerts=res["alerts"]
    )

def get_model():
    global global_model
    if global_model is None:
        if not os.path.exists(LOCAL_MODEL_PATH):
            subprocess.run([HDFS_BIN, "dfs", "-copyToLocal", HDFS_MODEL_PATH, LOCAL_MODEL_PATH], check=True)
        global_model = YOLO(LOCAL_MODEL_PATH)
    return global_model

def analyze_video(video_path):
    model = get_model()
    filename = os.path.basename(video_path)


    camera_id = random.randint(1, 10)
    location = random.choice(ciudades_usa)
    priority = random.choice(["alta", "media", "baja"])
    random_day = random.randint(1, 31)
    date = f"2010-07-{random_day:02d}"

    cap = cv2.VideoCapture(video_path)
    frame_interval = 30
    frame_index = 0

    counts_by_hour = defaultdict(lambda: defaultdict(int))
    random_hour = random.randint(0, 23)
    hour_slot = f"{random_hour:02d}:00-{(random_hour+1)%24:02d}:00"

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_index % frame_interval == 0:
            try:
                resized = cv2.resize(frame, (640, 360))
                results = model([resized], verbose=False)
                print(f"🔍 Uso de RAM tras detección: {psutil.Process().memory_info().rss / (1024 ** 2):.2f} MB")
                for result in results:
                    for det in result.boxes.data.tolist():
                        cls_id = int(det[5])
                        cls_name = model.names[cls_id]
                        counts_by_hour[hour_slot][cls_name] += 1
            except Exception:
                pass
        frame_index += 1

    cap.release()
    cv2.destroyAllWindows()

    return {
        "camera_id": camera_id,
        "location": location,
        "priority": priority,
        "video_file": filename,
        "date": date,
        "timeslots": [{
            "hour": hour,
            "object_counts": dict(counts_by_hour[hour])
        } for hour in sorted(counts_by_hour)],
        "alerts": []
    }

def copiar_y_procesar_particion(paths):
    nodo = socket.gethostname()
    pid = os.getpid()
    salidas = []

    for path in paths:
        base = os.path.basename(path)
        local_video = f"/tmp/{base}"
        local_json = f"/tmp/{os.path.splitext(base)[0]}.json"
        hdfs_json = f"{OUTPUT_JSON_DIR}/{os.path.splitext(base)[0]}.json"
        name = os.path.basename(hdfs_json)

        logs = []

        try:
            logs.append(f"[{nodo} PID {pid}] 🔽 Copiando {path}")
            subprocess.run([HDFS_BIN, "dfs", "-copyToLocal", path, local_video], check=True)
            logs.append(f"[{nodo} PID {pid}] 🧠 RAM antes de procesar: {psutil.Process().memory_info().rss / (1024 ** 2):.2f} MB")
            logs.append(f"[{nodo} PID {pid}] 🤖 Analizando {base}")
            result = analyze_video(local_video)
            with open(local_json, "w", encoding="utf-8") as f:
                json.dump({name: result}, f, indent=4, ensure_ascii=False)
            logs.append(f"[{nodo} PID {pid}] 🧠 RAM al finalizar: {psutil.Process().memory_info().rss / (1024 ** 2):.2f} MB")
            subprocess.run([HDFS_BIN, "dfs", "-copyFromLocal", "-f", local_json, hdfs_json], check=True)
            logs.append(f"[{nodo} PID {pid}] ✅ JSON subido: {hdfs_json}")

            # 👉 Guardar todos los logs como mensajes separados con resultado None
            for log in logs:
                salidas.append((log, None, None))
            # 👉 Agregar una sola vez el path procesado
            salidas.append((
                f"[{nodo} PID {pid}] 📁 Resultado JSON: {name}",
                result,
                (name, hdfs_json)  # esta es la tupla que irá a json_path
            ))

        except Exception:
            err = f"[{nodo} PID {pid}] ❌ Error en {base}:\n{traceback.format_exc()}"
            salidas.append((err, None, None))

        finally:
            if os.path.exists(local_video):
                os.remove(local_video)
            if os.path.exists(local_json):
                os.remove(local_json)

    return salidas

def borrar_directorio_hdfs(spark, ruta):
    try:
        fs = spark._jvm.org.apache.hadoop.fs.FileSystem.get(spark._jsc.hadoopConfiguration())
        path = spark._jvm.org.apache.hadoop.fs.Path(ruta)
        if fs.exists(path):
            fs.delete(path, True)
            print(f"🧹 Carpeta eliminada: {ruta}")
    except Exception as e:
        print(f"⚠️ Error al eliminar carpeta {ruta}: {e}", file=sys.stderr)

def main():
    spark = SparkSession.builder \
        .appName("YOLOv8_Procesamiento_Distribuido") \
        .enableHiveSupport() \
        .getOrCreate()

    borrar_directorio_hdfs(spark, OUTPUT_CAKE_DIR)
    borrar_directorio_hdfs(spark, LOG_COPY_DIR)
    borrar_directorio_hdfs(spark, OUTPUT_JSON_DIR)

    subprocess.run([HDFS_BIN, "dfs", "-mkdir", "-p", LOG_COPY_DIR], check=True)
    subprocess.run([HDFS_BIN, "dfs", "-mkdir", "-p", OUTPUT_JSON_DIR], check=True)

    df = spark.sql("SELECT path FROM videos_path")

    mensajes = df.rdd.map(lambda row: f"Hola soy {socket.gethostname()} y tengo el video {row['path']}")
    mensajes.saveAsTextFile(OUTPUT_CAKE_DIR)

    spark.sql("DROP TABLE IF EXISTS jsons")
    spark.sql("""
        CREATE TABLE jsons (
            video_name STRING,
            camera_id INT,
            location STRING,
            priority STRING,
            date STRING,
            timeslots ARRAY<STRUCT<
                hour: STRING,
                object_counts: MAP<STRING, INT>
            >>,
            alerts ARRAY<STRING>
        )
        STORED AS PARQUET
    """)
    print("✅ Tabla Hive 'jsons' creada.")

    logs_rdd = df.rdd.map(lambda row: row["path"]).repartition(4).mapPartitions(copiar_y_procesar_particion)
    salida = logs_rdd.collect()

    # Separar logs y json_paths
    all_logs = []
    json_paths_data = []
    data_for_hive = []

    for log_msg, result, json_path in salida:
        all_logs.append(log_msg)
        if result is not None:
            data_for_hive.append(result)
        if json_path is not None:
            json_paths_data.append(json_path)

    # Guardar logs
    local_log_path = "/tmp/log_videos_full.txt"
    with open(local_log_path, "w", encoding="utf-8") as f:
        f.write("\n".join(all_logs))
    subprocess.run([HDFS_BIN, "dfs", "-copyFromLocal", "-f", local_log_path, f"{LOG_COPY_DIR}/log_videos_full.txt"])
    os.remove(local_log_path)
    print(f"📄 Log guardado en {LOG_COPY_DIR}/log_videos_full.txt")


    # Insertar directamente en Hive si hay datos
    if data_for_hive:
        rows = [convertir_a_row(r) for r in data_for_hive]
        hive_df = spark.createDataFrame(rows, schema=schema)
        hive_df.write.insertInto("jsons", overwrite=False)
        print("✅ Datos insertados en Hive correctamente.")
    else:
        print("⚠️ No se insertaron datos. Ningún video procesado correctamente.")

    # Crear tabla Hive json_path
    try:
        spark.sql("DROP TABLE IF EXISTS json_path")
        if json_paths_data:
            rows = [Row(name=name, path=path) for name, path in json_paths_data]
            json_df = spark.createDataFrame(rows)
            json_df.write.mode("overwrite").saveAsTable("json_path")
            print("✅ Tabla Hive 'json_path' creada correctamente.")
        else:
            print("⚠️ No se encontraron archivos JSON procesados. Tabla 'json_path' no creada.")
    except Exception as e:
        print(f"❌ Error al crear la tabla json_path: {e}", file=sys.stderr)

    spark.stop()

if __name__ == "__main__":
    main()
