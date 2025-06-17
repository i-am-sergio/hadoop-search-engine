from fastapi import FastAPI
from pyspark.sql import SparkSession
import uvicorn

app = FastAPI()

# Spark en modo local
spark = SparkSession.builder \
    .appName("HiveSearchApp") \
    .master("local[*]") \
    .config("spark.driver.bindAddress", "127.0.0.1") \
    .enableHiveSupport() \
    .getOrCreate()

# @app.get("/wordcounts")
# def read_wordcounts():
#     df = spark.sql("SELECT * FROM word_counts")
#     return [row.asDict() for row in df.collect()]

# @app.get("/videos")
# def read_videos():
#     df = spark.sql("SELECT * FROM videos_path")
#     return [row.asDict() for row in df.collect()]



# spark.sql("CACHE TABLE invertedindex")
# spark.sql("CACHE TABLE jsons")


@app.get("/videos")
def read_videos():
    df = spark.sql("SELECT * FROM videos_path")
    data = [row.asDict() for row in df.collect()]
    return data

@app.get("/jsons")
def read_videos():
    df = spark.sql("SELECT * FROM jsons")
    data = [row.asDict() for row in df.collect()]
    return data

@app.get("/invertedindex")
def read_videos():
    df = spark.sql("SELECT * FROM invertedindex")
    data = [row.asDict() for row in df.collect()]
    return data


# curl http://localhost:4000/videopath/person
@app.get("/videopath/{entityname}")
def get_video_paths(entityname: str):
    try:
        query = f"""
        SELECT files 
        FROM invertedindex 
        WHERE entity = '{entityname}'
        """
        df = spark.sql(query)

        # Verifica si hay resultados
        if df.count() == 0:
            return {"entity": entityname, "files": []}

        row = df.first()

        # Verifica si la columna 'files' existe y no es None
        if row is None or row["files"] is None:
            return {"entity": entityname, "files": []}

        files = row["files"]

        # Asegura que sea una lista JSON serializable
        return {
            "entity": entityname,
            "files": list(files)  # por si es tipo JavaArray
        }

    except Exception as e:
        return {"error": str(e)}


# http://localhost:4000/videopath/person/orderbydate
@app.get("/videopath/{entityname}/orderbydate")
def get_video_paths_ordered_by_date(entityname: str):
    # Paso 1: Obtener archivos desde tabla invertedindex
    query_index = f"""
        SELECT files FROM invertedindex WHERE entity = '{entityname}'
    """
    df_files = spark.sql(query_index)

    if df_files.count() == 0:
        return {"entity": entityname, "videos": []}

    files = df_files.first()["files"]
    if not files:
        return {"entity": entityname, "videos": []}

    # Paso 2: Convertimos files en lista de strings SQL
    files_list_str = ", ".join([f"'{f}'" for f in files])

    # Paso 3: Consultar jsons filtrando por video_name
    query_jsons = f"""
        SELECT 
            video_name, camera_id, location, priority, `date`, timeslots, alerts
        FROM jsons
        WHERE video_name IN ({files_list_str})
        ORDER BY `date` DESC
    """
    df_jsons = spark.sql(query_jsons)

    # Paso 4: Convertir a estructura esperada
    result = []
    for row in df_jsons.collect():
        result.append({
            "camera_id": row["camera_id"],
            "location": row["location"],
            "priority": row["priority"],
            "video_file": row["video_name"],
            "date": row["date"],
            "timeslots": row["timeslots"],
            "alerts": row["alerts"],
        })

    return {
        "entity": entityname,
        "videos": result
    }


# http://localhost:4000/videopath/person/orderbydate
@app.get("/videopath/{entityname}/noorderbydate")
def get_video_paths_ordered_by_date(entityname: str):
    # Paso 1: Obtener archivos desde tabla invertedindex
    query_index = f"""
        SELECT files FROM invertedindex WHERE entity = '{entityname}'
    """
    df_files = spark.sql(query_index)

    if df_files.count() == 0:
        return {"entity": entityname, "videos": []}

    files = df_files.first()["files"]
    if not files:
        return {"entity": entityname, "videos": []}

    # Paso 2: Convertimos files en lista de strings SQL
    files_list_str = ", ".join([f"'{f}'" for f in files])

    # Paso 3: Consultar jsons filtrando por video_name
    query_jsons = f"""
        SELECT 
            video_name, camera_id, location, priority, `date`, timeslots, alerts
        FROM jsons
        WHERE video_name IN ({files_list_str})
    """
    df_jsons = spark.sql(query_jsons)

    # Paso 4: Convertir a estructura esperada
    result = []
    for row in df_jsons.collect():
        result.append({
            "camera_id": row["camera_id"],
            "location": row["location"],
            "priority": row["priority"],
            "video_file": row["video_name"],
            "date": row["date"],
            "timeslots": row["timeslots"],
            "alerts": row["alerts"],
        })

    return {
        "entity": entityname,
        "videos": result
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4000)
