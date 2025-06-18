from pyspark.sql import SparkSession
import os

# Crear SparkSession con soporte Hive
spark = SparkSession.builder \
    .appName("SubirVideosYCrearTablaHive") \
    .enableHiveSupport() \
    .getOrCreate()

# Directorios
local_video_dir = "./videos"
hdfs_video_dir = "/videos"

# 1. Eliminar carpeta en HDFS si ya existe
print(f"🔁 Eliminando carpeta HDFS {hdfs_video_dir} si existe...")
os.system(f"hdfs dfs -rm -r -f {hdfs_video_dir}")

# 2. Subir archivos .mp4 al HDFS
video_files = [f for f in os.listdir(local_video_dir) if f.endswith(".mp4")]
os.system(f"hdfs dfs -mkdir -p {hdfs_video_dir}")

for video in video_files:
    local_path = os.path.join(local_video_dir, video)
    hdfs_path = f"{hdfs_video_dir}/{video}"
    print(f"⬆️ Subiendo {local_path} → {hdfs_path}")
    os.system(f"hdfs dfs -put -f {local_path} {hdfs_path}")

# 3. Crear DataFrame con (name, path)
datos = [(video, f"{hdfs_video_dir}/{video}") for video in video_files]
df = spark.createDataFrame(datos, ["name", "path"])

# 4. Limpiar tabla Hive si existe y luego escribir
print("🧹 Limpiando tabla Hive videos_path si existe...")
spark.sql("DROP TABLE IF EXISTS videos_path")
print("📦 Creando nueva tabla Hive con los datos actualizados...")
df.write.saveAsTable("videos_path")

# Verifica que se guardó correctamente (opcional)
df.show()

spark.stop()
