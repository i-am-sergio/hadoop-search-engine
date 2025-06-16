from fastapi import FastAPI
from pyspark.sql import SparkSession
from typing import List
import uvicorn

app = FastAPI()

# Crear SparkSession al iniciar el servidor
spark = SparkSession.builder \
    .appName("HiveSearchApp") \
    .enableHiveSupport() \
    .config("hive.metastore.uris", "thrift://fedora:9083") \
    .getOrCreate()

# # (Opcional) Cachear tabla si es muy consultada
# spark.sql("CACHE TABLE word_counts")

@app.get("/wordcounts")
def read_wordcounts():
    df = spark.sql("SELECT * FROM word_counts")
    data = [row.asDict() for row in df.collect()]
    return data

@app.get("/videos")
def read_videos():
    df = spark.sql("SELECT * FROM videos_path")
    data = [row.asDict() for row in df.collect()]
    return data


# @app.get("/search/{keyword}")
# def search_videos(keyword: str):
#     df = spark.sql(f"SELECT files FROM inverted_index WHERE keyword = '{keyword}'")
#     if df.count() == 0:
#         return {"videos": []}
    
#     files = df.first()['files'].split(',')
#     files_str = ",".join([f"'{f.strip()}'" for f in files])
    
#     metadata_df = spark.sql(f"SELECT * FROM video_metadata WHERE name IN ({files_str})")
#     results = [row.asDict() for row in metadata_df.collect()]
    
#     return {"videos": results}

# Opcional: si corres sin uvicorn CLI
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4000)
