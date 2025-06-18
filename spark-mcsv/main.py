from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pyspark.sql import SparkSession
import uvicorn

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # también puedes usar ["*"] para permitir todo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
def get_video_paths_no_ordered_by_date(entityname: str):
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


@app.get("/videopath/{entityname}/priority/{priority_level}")
def get_video_paths_by_priority(entityname: str, priority_level: str):
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

    # Convertimos a lista de strings SQL
    files_list_str = ", ".join([f"'{f}'" for f in files])

    # Paso 2: Filtrar desde jsons por video_name y prioridad
    query_jsons = f"""
        SELECT 
            video_name, camera_id, location, priority, `date`, timeslots, alerts
        FROM jsons
        WHERE video_name IN ({files_list_str})
          AND LOWER(priority) = LOWER('{priority_level}')
    """
    df_jsons = spark.sql(query_jsons)

    # Paso 3: Convertir a estructura esperada
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
            "video_path_in_hdfs": f"hdfs:///ruta/{row['video_name']}"  # opcional: integrar tabla real de paths
        })

    return {
        "entity": entityname,
        "priority": priority_level,
        "videos": result
    }


@app.get("/search")
def search_entities(q: str = Query(...)):
    entities = [e.strip().lower() for e in q.split(",") if e.strip()]
    all_videos = []

    for entity in entities:
        # 1. Obtener archivos de esa entidad
        query_index = f"""
            SELECT files FROM invertedindex WHERE LOWER(entity) = '{entity}'
        """
        df_files = spark.sql(query_index)

        if df_files.count() == 0:
            continue

        files = df_files.first()["files"]
        if not files:
            continue

        # Convertimos a lista SQL
        files_list_str = ", ".join([f"'{f}'" for f in files])

        # 2. Obtener los jsons relacionados
        query_jsons = f"""
            SELECT 
                video_name, camera_id, location, priority, `date`, timeslots, alerts
            FROM jsons
            WHERE video_name IN ({files_list_str})
        """
        df_jsons = spark.sql(query_jsons)

        for row in df_jsons.collect():
            all_videos.append({
                "camera_id": row["camera_id"],
                "location": row["location"],
                "priority": row["priority"],
                "video_file": row["video_name"],
                "date": row["date"],
                "timeslots": row["timeslots"],
                "alerts": row["alerts"],
                "video_path_in_hdfs": f"hdfs:///videos/{row['video_name']}"
            })

    return {
        "entity": entities,
        "videos": all_videos
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4000)
