from fastapi import FastAPI
from pyhive import hive
from typing import List
import json

app = FastAPI()

def get_hive_connection():
    # Ajusta host y puerto si tu Hive está en otra dirección o puerto
    return hive.Connection(host='localhost', port=10000, username='hadoop')

@app.get("/wordcounts")
def read_wordcounts():
    conn = get_hive_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM word_counts")
    results = cursor.fetchall()
    columns = [desc[0].split('.')[-1] for desc in cursor.description]  # ['word', 'count']
    data = [dict(zip(columns, row)) for row in results]
    return data
