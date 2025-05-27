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

> *Aquí explicamos cómo se generaron datos similares si no se usaron directamente los originales. Por ejemplo, scripts en Python para alterar marcas de tiempo, densidad de eventos, o para combinar archivos.*

### 2.3 Carga al HDFS

Se cargaron los datos al Hadoop Distributed File System (HDFS) usando comandos CLI:

```bash
hdfs dfs -mkdir -p /user/hadoop/input
hdfs dfs -put cam_01_entrada_principal_2024-04-13.json /user/hadoop/input
hdfs dfs -put cam_02_pasillo_b_2024-04-13.json /user/hadoop/input
hdfs dfs -put cam_03_bicicleteros_2024-04-13.json /user/hadoop/input
hdfs dfs -ls /user/hadoop/input
```

---

### 2.4 Instalación y Configuración del Clúster Hadoop

Se configuró un clúster Hadoop con cuatro nodos, cada uno con Ubuntu y Java 8:

| IP           | Hostname      |
| ------------ | ------------- |
| 10.7.135.140 | fedora        |
| 10.7.135.0   | debian        |
| 10.7.134.197 | paul (master) |
| 10.7.135.212 | aldo-nitro    |

#### 2.4.1 Instalación básica

```bash
sudo apt update
sudo apt install openjdk-8-jdk openssh-server
sudo adduser hadoop
sudo usermod -aG sudo hadoop
su - hadoop
ssh-keygen -t rsa
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

Descarga e instalación de Hadoop 3.3.6:

```bash
wget https://dlcdn.apache.org/hadoop/common/hadoop-3.3.6/hadoop-3.3.6.tar.gz
tar xzf hadoop-3.3.6.tar.gz
mv hadoop-3.3.6 hadoop
```

Variables de entorno en `~/.bashrc`:

```bash
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

Formato del NameNode e inicio del clúster:

```bash
hdfs namenode -format
start-all.sh
yarn node -list
```

#### 2.4.2 Configuración de XML básicos

##### `core-site.xml`

```xml
<configuration>
  <property>
    <name>fs.defaultFS</name>
    <value>hdfs://paul:9000</value>
  </property>
  <property>
    <name>io.file.buffer.size</name>
    <value>65536</value>
  </property>
</configuration>
```

##### `hdfs-site.xml`

```xml
<configuration>
  <property>
    <name>dfs.replication</name>
    <value>4</value>
  </property>
  <property>
    <name>dfs.name.dir</name>
    <value>file:///home/hadoop/hadoopdata/hdfs/namenode</value>
  </property>
  <property>
    <name>dfs.data.dir</name>
    <value>file:///home/hadoop/hadoopdata/hdfs/datanode</value>
  </property>
  <property>
    <name>dfs.blocksize</name>
    <value>268435456</value>
  </property>
  <property>
    <name>dfs.client.socket.send.buffer.size</name>
    <value>131072</value>
  </property>
  <property>
    <name>dfs.client.socket.receive.buffer.size</name>
    <value>131072</value>
  </property>
  <property>
    <name>dfs.datanode.max.transfer.threads</name>
    <value>16384</value>
  </property>
  <property>
    <name>dfs.permissions</name>
    <value>false</value>
  </property>
</configuration>
```

##### `mapred-site.xml`

```xml
<configuration>
  <property>
    <name>mapreduce.framework.name</name>
    <value>yarn</value>
  </property>
  <property>
    <name>mapreduce.jobhistory.address</name>
    <value>paul:10020</value>
  </property>
  <property>
    <name>mapreduce.jobhistory.webapp.address</name>
    <value>paul:19888</value>
  </property>
  <property>
    <name>yarn.app.mapreduce.am.env</name>
    <value>HADOOP_MAPRED_HOME=/home/hadoop/hadoop</value>
  </property>
  <property>
    <name>mapreduce.map.env</name>
    <value>HADOOP_MAPRED_HOME=/home/hadoop/hadoop</value>
  </property>
  <property>
    <name>mapreduce.reduce.env</name>
    <value>HADOOP_MAPRED_HOME=/home/hadoop/hadoop</value>
  </property>
</configuration>
```

##### `yarn-site.xml`

```xml
<configuration>
  <property>
    <name>yarn.resourcemanager.hostname</name>
    <value>paul</value>
  </property>
  <property>
    <name>yarn.resourcemanager.scheduler.address</name>
    <value>paul:8030</value>
  </property>
  <property>
    <name>yarn.resourcemanager.resource-tracker.address</name>
    <value>paul:8025</value>
  </property>
  <property>
    <name>yarn.resourcemanager.admin.address</name>
    <value>paul:8011</value>
  </property>
  <property>
    <name>yarn.nodemanager.aux-services</name>
    <value>mapreduce_shuffle</value>
  </property>
</configuration>
```

##### `workers`

> Lista de hostnames/IP de nodos esclavos.

---

### 2.5 Procesamiento de Video con YOLOv5

Se utilizó un modelo preentrenado YOLOv5s para detectar objetos en video y generar reportes JSON por intervalos de 10 segundos.

```python
import cv2
import torch
from collections import defaultdict
from datetime import timedelta
import json

model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
TARGET_OBJECTS = {'person', 'backpack', 'car'}
cap = cv2.VideoCapture('video.mp4')

fps = cap.get(cv2.CAP_PROP_FPS)
timeslot_results = defaultdict(lambda: defaultdict(int))

def get_timeslot(sec):
    start = int(sec // 10) * 10
    end = start + 10
    return f"{str(timedelta(seconds=start))[:-3]}-{str(timedelta(seconds=end))[:-3]}"

frame_idx = 0
while True:
    ret, frame = cap.read()
    if not ret: break
    t = frame_idx / fps
    slot = get_timeslot(t)
    results = model(frame)
    for *_, conf, cls in results.xyxy[0]:
        label = results.names[int(cls)]
        if label in TARGET_OBJECTS:
            timeslot_results[slot][label] += 1
    frame_idx += 1

cap.release()
output = {"timeslots": [{"hour": h, "object_counts": dict(c)} for h, c in sorted(timeslot_results.items())]}
with open("output.json", "w") as f:
    json.dump(output, f, indent=4)
```

---

## 3. Implementación de Algoritmos

### 3.1 Índice Invertido

* **Principios teóricos:** Explicación breve.
* **Implementación MapReduce:** Descripción de las clases Mapper y Reducer.
* **Formato clave-valor:** `<palabra, documento>` → lista de posiciones.
* **Almacenamiento:** Resultado en HDFS en `/user/hadoop/inverted_index`.

### 3.2 PageRank

* **Descripción del algoritmo:** Ecuación iterativa.
* **Adaptación a JSON:** Extracción de enlaces entre “documentos” del dataset.
* **Iteraciones MapReduce:** Control de convergencia.
* **Salida:** Puntuaciones en `/user/hadoop/pagerank`.

---

## 4. Arquitectura del Motor de Búsqueda

### 4.1 Diagrama General

*Aquí insertar diagrama (por ejemplo, con draw\.io) que muestre flujo:*  
Ingreso → HDFS → MapReduce (Índice Invertido & PageRank) → Almacenamiento → Interfaz Web/API

### 4.2 Componentes Principales

* **Carga en HDFS**
* **Job de Índice Invertido (MapReduce)**
* **Job de PageRank (MapReduce)**
* **Servicio Web / Interfaz de Búsqueda**

---

## 5. Interfaz del Motor de Búsqueda

* **Tecnologías:** Flask + React (o Node.js + Express)
* **Funcionalidades:**
  * Búsqueda por palabra clave
  * Orden por puntuación PageRank
  * Paginación de resultados
* **Integración:**
  * Conexión al NameNode para leer índices
  * Llamadas a jobs en segundo plano si es necesario

---

## 6. Desafíos y Problemas Encontrados

* **Configuración SSH y claves:** Problemas de permisos en nodos esclavos.
* **MapReduce lento:** Tiempo alto (≈4 min) para archivos >1 GB; se optimizó con mayores buffers y bloques más grandes.
* **Convergencia de PageRank:** Ajuste de número de iteraciones vs. umbral de tolerancia.
* **Integración de YOLOv5:** Dependencias de PyTorch en nodos no preparados; se dockerizó la etapa de detección.
* **Interfaz:** Retardo en consultas concurrentes; se consideró caching de índices en memoria.

---

## 7. Conclusiones

Se logró un motor de búsqueda distribuido funcional que indexa documentos JSON y ordena resultados según relevancia PageRank. Aprendizajes clave incluyeron la configuración de un clúster Hadoop real, ajustes de rendimiento para grandes volúmenes y la integración de análisis de video con YOLOv5. Futuras mejoras: escalabilidad dinámica y balanceo de carga avanzado.

---

## 8. Anexos

* **Comandos Hadoop:** Lista completa de CLI utilizadas.
* **Fragmentos de código:** Mappers, Reducers, script YOLOv5.
* **Capturas de pantalla:** Resource Manager, logs de job history.
* **Tiempos de ejecución:** Comparativa antes/después de optimizaciones.
