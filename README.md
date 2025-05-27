# Informe de Proyecto: Motor de Búsqueda usando Hadoop 

**Curso:** Big Data  
**Proyecto:** Motor de Búsqueda Distribuido con Hadoop y algoritmos: índice invertido y PageRank  
**Integrantes del grupo:**
1. MALDONADO CASILLA, BRAULIO NAYAP  
2. MOGOLLÓN CÁCERES, SERGIO DANIEL  
3. PARIZACA MOZO, PAUL ANTONY  
4. MARTÍNEZ CHOQUE, ALDO RAÚL  
5. APAZA APAZA, NELZON JORGE  

---

## 1. Introducción

Este informe describe el desarrollo del motor de búsqueda distribuido utilizando el framework Apache Hadoop. Se implementaron dos algoritmos fundamentales: el **índice invertido** para la recuperación eficiente de documentos y **PageRank** para la evaluación de la relevancia. El sistema se ejecuta sobre un clúster de mínimo 3 nodos y emplea como fuente de datos archivos JSON relacionados con videovigilancia y resultados de detección de objetos en video.

---

## 2. Generación y Preparación de Datos

### 2.1 Descripción de los Archivos de Entrada

- `cam_01_entrada_principal_2024-04-13.json`  
- `cam_02_pasillo_b_2024-04-13.json`  
- `cam_03_bicicleteros_2024-04-13.json`  

Estos archivos están inspirados en el dataset **VIRAT Video Dataset** (https://viratdata.org/) y contienen metadatos de eventos detectados por distintas cámaras de vigilancia.

### 2.2 Proceso de Generación de Datos Sintéticos

Para simular mayor volumen y diversidad se desarrollaron scripts en Python y TypeScript:

- **Python (`generate.py`)**:  
  - **¿Qué hace?** Genera N archivos JSON con metadatos de cámara aleatorios.  
  - **Campos:** `camera_id`, `location`, `priority`, `video_file`, `date`, `object_counts`.  
  - **Salida:** Directorio `random_camera_data/` con `camera_data_i.json`.  

  ```python
  def generate_random_files(num_files):
      """
      Genera archivos JSON con metadatos de cámaras:
      - camera_id: cam_01 … cam_10
      - location: Main Entrance, Loading Dock, Cafeteria, …
      - priority: baja, media, alta
      - video_file: acorde a la ubicación
      - date: fecha aleatoria (YYYY-MM-DD)
      - object_counts: conteos aleatorios de objetos
      """
      # … (ver código completo en Anexo)
  ````

* **TypeScript (normalización de etiquetas):**

  * **¿Qué hace?** Traduce y pasa a singular etiquetas en español a sus equivalentes en inglés.

  ```typescript
  const hashES_EN: {[key:string]:string} = {
    "personas":   "person",
    "autos":      "car",
    "bicicletas": "bicycle",
    // …
  };
  resultado = tokens.map(t => hashES_EN[t.toLowerCase()] || t.toLowerCase());
  ```

* **Filtrado de COCO:**

  * **¿Qué hace?** Consulta la lista oficial de clases COCO para seleccionar solo objetos soportados.
  * **Enlace:** [https://github.com/ultralytics/yolov5/blob/master/data/coco.yaml](https://github.com/ultralytics/yolov5/blob/master/data/coco.yaml)

---

### 2.3 Fuentes de Datos Adicionales

Además del dataset VIRAT, se incorporaron dos colecciones de Kaggle:

* **Smart-City CCTV Violence Detection Dataset (SCVD)**
* **CCTV Action Recognition Dataset**

---

### 2.4 Carga al HDFS

* **¿Qué hace?** Crea el directorio de entrada en HDFS y sube los JSON generados.

```bash
hdfs dfs -mkdir -p /user/hadoop/input
hdfs dfs -put cam_01_entrada_principal_2024-04-13.json /user/hadoop/input
hdfs dfs -put cam_02_pasillo_b_2024-04-13.json /user/hadoop/input
hdfs dfs -put cam_03_bicicleteros_2024-04-13.json /user/hadoop/input
hdfs dfs -ls /user/hadoop/input
```

---

## 3. Configuración del Clúster Hadoop

### 3.1 Topología y preparación

Clúster de cuatro nodos con Ubuntu y Java 8:

| IP           | Hostname      |
| ------------ | ------------- |
| 10.7.135.140 | fedora        |
| 10.7.135.0   | debian        |
| 10.7.134.197 | paul (master) |
| 10.7.135.212 | aldo-nitro    |

* **¿Qué hace este bloque?** Instala Java, habilita SSH sin contraseña y genera claves.

```bash
sudo apt update
sudo apt install openjdk-8-jdk openssh-server
sudo adduser hadoop
sudo usermod -aG sudo hadoop
su - hadoop
ssh-keygen -t rsa
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

* **¿Qué hace este bloque?** Descarga y despliega Hadoop 3.3.6.

```bash
wget https://dlcdn.apache.org/hadoop/common/hadoop-3.3.6/hadoop-3.3.6.tar.gz
tar xzf hadoop-3.3.6.tar.gz
mv hadoop-3.3.6 hadoop
```

* **¿Qué hace este bloque?** Configura las variables de entorno para Hadoop.

```bash
# Añadir a ~/.bashrc
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
export HADOOP_HOME=/home/hadoop/hadoop
export HADOOP_INSTALL=$HADOOP_HOME
export HADOOP_MAPRED_HOME=$HADOOP_HOME
export HADOOP_COMMON_HOME=$HADOOP_HOME
export HADOOP_HDFS_HOME=$HADOOP_HOME
export HADOOP_YARN_HOME=$HADOOP_HOME
export HADOOP_COMMON_LIB_NATIVE_DIR=$HADOOP_HOME/lib/native
export PATH=$PATH:$HADOOP_HOME/sbin:$HADOOP_HOME/bin
export HADOOP_OPTS="-Djava.library.path=$HADOOP_HOME/lib/native"
source ~/.bashrc
```

* **¿Qué hace este bloque?** Formatea el NameNode e inicia todos los servicios Hadoop/YARN.

```bash
hdfs namenode -format
start-all.sh
yarn node -list
```

---

### 3.2 Configuración XML

#### `core-site.xml`

* **¿Qué hace?** Define el sistema de archivos por defecto y ajusta buffer I/O.

```xml
<configuration>
  <property><name>fs.defaultFS</name><value>hdfs://paul:9000</value></property>
  <property><name>io.file.buffer.size</name><value>65536</value></property>
</configuration>
```

#### `hdfs-site.xml`

* **¿Qué hace?** Configura replicación, directorios de datos, tamaño de bloque y buffers de socket.

```xml
<configuration>
  <property><name>dfs.replication</name><value>4</value></property>
  <property><name>dfs.name.dir</name><value>file:///home/hadoop/hadoopdata/hdfs/namenode</value></property>
  <property><name>dfs.data.dir</name><value>file:///home/hadoop/hadoopdata/hdfs/datanode</value></property>
  <property><name>dfs.blocksize</name><value>268435456</value></property>
  <property><name>dfs.client.socket.send.buffer.size</name><value>131072</value></property>
  <property><name>dfs.client.socket.receive.buffer.size</name><value>131072</value></property>
  <property><name>dfs.datanode.max.transfer.threads</name><value>16384</value></property>
  <property><name>dfs.permissions</name><value>false</value></property>
</configuration>
```

#### `mapred-site.xml`

* **¿Qué hace?** Indica que MapReduce corre sobre YARN y configura el JobHistory.

```xml
<configuration>
  <property><name>mapreduce.framework.name</name><value>yarn</value></property>
  <property><name>mapreduce.jobhistory.address</name><value>paul:10020</value></property>
  <property><name>mapreduce.jobhistory.webapp.address</name><value>paul:19888</value></property>
  <property><name>yarn.app.mapreduce.am.env</name><value>HADOOP_MAPRED_HOME=/home/hadoop/hadoop</value></property>
  <property><name>mapreduce.map.env</name><value>HADOOP_MAPRED_HOME=/home/hadoop/hadoop</value></property>
  <property><name>mapreduce.reduce.env</name><value>HADOOP_MAPRED_HOME=/home/hadoop/hadoop</value></property>
</configuration>
```

#### `yarn-site.xml`

* **¿Qué hace?** Define el ResourceManager y aux-servicios para shuffle.

```xml
<configuration>
  <property><name>yarn.resourcemanager.hostname</name><value>paul</value></property>
  <property><name>yarn.resourcemanager.scheduler.address</name><value>paul:8030</value></property>
  <property><name>yarn.resourcemanager.resource-tracker.address</name><value>paul:8025</value></property>
  <property><name>yarn.resourcemanager.admin.address</name><value>paul:8011</value></property>
  <property><name>yarn.nodemanager.aux-services</name><value>mapreduce_shuffle</value></property>
</configuration>
```

##### `workers`

> Lista de hostnames/IP de nodos esclavos.

---

## 4. Procesamiento de Video con YOLO

### 4.1 YOLOv5 en Python

* **¿Qué hace?** Detecta objetos (“person”, “backpack”, “car”) en video y agrupa conteos por intervalos de 10 s.

```python
import cv2, torch, json
from collections import defaultdict
from datetime import timedelta

model = torch.hub.load('ultralytics/yolov5','yolov5s',pretrained=True)
TARGET={'person','backpack','car'}
cap=cv2.VideoCapture('video.mp4')
fps=cap.get(cv2.CAP_PROP_FPS)
results=defaultdict(lambda:defaultdict(int))

def slot(sec):
  s=int(sec//10)*10; e=s+10
  return f"{str(timedelta(seconds=s))[:-3]}-{str(timedelta(seconds=e))[:-3]}"

i=0
while True:
  ret,frm=cap.read()
  if not ret: break
  t=i/fps; sl=slot(t)
  for *_,conf,cls in model(frm).xyxy[0]:
    lbl=model.names[int(cls)]
    if lbl in TARGET: results[sl][lbl]+=1
  i+=1
cap.release()

out={"timeslots":[{"hour":h,"object_counts":dict(c)} for h,c in sorted(results.items())]}
with open("output.json","w") as f: json.dump(out,f,indent=4)
```

### 4.2 YOLOv8 Distribuido con Java + Streaming

* **¿Qué hace?** Reparte la tarea de detección por video entre nodos via Hadoop Streaming y un mapper Java que invoca el script Python.

```bash
# Subir scripts y modelo
hdfs dfs -mkdir -p /user/hadoop/scripts /user/hadoop/models
hdfs dfs -put process_video.py /user/hadoop/scripts/
hdfs dfs -put yolov8n.pt      /user/hadoop/models/

# Listar videos en HDFS
hdfs dfs -ls -R /videos | awk '$8~/.mp4$/{print $8}' > videos_list.txt
hdfs dfs -put videos_list.txt /user/hadoop/

# Ejecutar Hadoop Streaming con Java mapper
hadoop jar /usr/lib/hadoop-mapreduce/hadoop-streaming-3.3.6.jar \
  -files /user/hadoop/scripts/process_video.py \
  -input  /user/hadoop/videos_list.txt \
  -output /user/hadoop/output_jsons_yolo \
  -mapper "java -jar VideoProcessor.jar" \
  -numReduceTasks 0
```

---

## 5. Implementación de Algoritmos

### 5.1 Índice Invertido

* **Teoría:** Indexa cada palabra con documentos y posiciones.
* **MapReduce:**

  * *Mapper*: tokeniza JSON y emite `<palabra, doc>`.
  * *Reducer*: agrega listas de posiciones.
* **Salida:** `/user/hadoop/inverted_index`.

### 5.2 PageRank

* **Algoritmo:** Iterativo de PageRank adaptado a enlaces JSON.
* **MapReduce:** Cada iteración es un job, se detiene al converger.
* **Salida:** `/user/hadoop/pagerank`.

---

## 6. Interfaz del Motor de Búsqueda

* **Frontend:** React + TypeScript.
* **`SearchEngineView.tsx`**: muestra lista de videos y controla estado `modalVideo`.
* **`VideoInformation.tsx`** (modal): contiene `VideoPlayer.tsx` + panel de metadatos.
* **`VideoPlayer.tsx`**: reproductor HTML para `.mp4`.
* **Git Flow:** ramas `feature-video`, merges con `main` via `git pull origin <rama>`.

---

## 7. Desafíos y Problemas Encontrados

* **Firewall/VPN:** bloqueo SSH en `ham0`; resuelto con `firewall-cmd --add-interface=ham0`.
* **Generación sintética:** scripts ajustados para normalizar etiquetas y anidar claves.
* **Hadoop Streaming:** faltaba shebang y permisos `chmod +x`; mpɡ→mp4 para compatibilidad.
* **Java Streaming:** mapper Java requería rutas HDFS correctas.
* **Race conditions:** mitigadas creando listados individuales por nodo.
* **Escalabilidad:** Raspberry Pi falló bajo carga; ajustar `yarn.nodemanager.resource.memory-mb`.
* **Ramas Git:** merges tras pushes en `main`, `aldo`, `feature-video`.

---

## 8. Conclusiones

Se desarrolló un motor de búsqueda distribuido funcional, combinando índices invertidos, PageRank y detección de objetos con YOLO en un clúster real de Hadoop. Se optimizaron procesos, se resolvieron conflictos de red, streaming y Git, y se integró una interfaz interactiva. Futuras mejoras: escalabilidad dinámica, balanceo de carga y refinamiento UI.

---

## 9. Anexos

* **Comandos Hadoop** (CLI).
* **Scripts Python/Java/TS** completos.
* **Capturas** de Resource Manager, terminales y Discord.
* **Tabla de tiempos** antes vs. después de optimizaciones.

