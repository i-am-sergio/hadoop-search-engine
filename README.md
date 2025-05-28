# Informe de Proyecto: Motor de Búsqueda usando Hadoop

Hecho por:

1. MALDONADO CASILLA, BRAULIO NAYAP
2. MOGOLLÓN CÁCERES, SERGIO DANIEL
3. PARIZACA MOZO, PAUL ANTONY
4. MARTÍNEZ CHOQUE, ALDO RAÚL
5. APAZA APAZA, NELZON JORGE

## 1. Introducción

Este informe describe el desarrollo del motor de búsqueda distribuido utilizando el framework Apache Hadoop. Se implementaron dos algoritmos fundamentales: el **índice invertido** para la recuperación eficiente de documentos y **PageRank** para la evaluación de la relevancia. El sistema se ejecuta sobre un clúster de mínimo 3 nodos y emplea como fuente de datos archivos JSON relacionados con videovigilancia y resultados de detección de objetos en video.

## 2. Prerequisitos

### 2.1 Configuración del Clúster Hadoop

#### 2.1.1 Topología y preparación

Clúster de cuatro nodos y Java 8:

| IP           | Hostname      |
| ------------ | ------------- |
| 10.7.135.140 | fedora        |
| 10.7.135.0   | debian        |
| 10.7.134.197 | paul (master) |
| 10.7.135.212 | aldo-nitro    |

- Instala Java, habilita SSH sin contraseña y genera claves.

```bash
sudo apt update
sudo apt install openjdk-8-jdk openssh-server
sudo adduser hadoop
sudo usermod -aG sudo hadoop
su - hadoop
ssh-keygen -t rsa
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

- Descarga y despliega Hadoop 3.3.6.

```bash
wget https://dlcdn.apache.org/hadoop/common/hadoop-3.3.6/hadoop-3.3.6.tar.gz
tar xzf hadoop-3.3.6.tar.gz
mv hadoop-3.3.6 hadoop
```

- Configura las variables de entorno para Hadoop.

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

- Formatea el NameNode e inicia todos los servicios Hadoop/YARN.

```bash
hdfs namenode -format
start-all.sh
yarn node -list
```

#### 2.2.1 Configuración XML

##### `core-site.xml`

- Define el sistema de archivos por defecto y ajusta buffer I/O.

```xml
<configuration>
  <property><name>fs.defaultFS</name><value>hdfs://paul:9000</value></property>
  <property><name>io.file.buffer.size</name><value>65536</value></property>
</configuration>
```

##### `hdfs-site.xml`

- Configura replicación, directorios de datos, tamaño de bloque y buffers de socket.

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

##### `mapred-site.xml`

- Indica que MapReduce corre sobre YARN y configura el JobHistory.

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

##### `yarn-site.xml`

- Define el ResourceManager y aux-servicios para shuffle.

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

```xml
paul
fedora
debian
aldo-nitro
```

### 2.2 Dataset de Videos

Aca coloca ALdo.
![Ejecucion en Master](.docs/put%20videos.png)

![Ejecucion en Master](.docs/put%20videos_2.png)

### 2.3 Preparación de Nodos

Cada nodo debe tener instalado:

```bash
pip install ultralytics opencv-python
```

Y debe contener en su directorio raíz:

- `process.py` — analiza un video y genera el `.json` correspondiente en HDFS.
- `daemon.py` — escucha el archivo `/tmp/videos_a_procesar.txt` y ejecuta `process.py` automáticamente cuando hay un nuevo video.

## 3. Procesamiento de Videos

Se implementa un sistema distribuido de análisis de videos usando **YOLOv8** sobre un clúster **Hadoop**. El sistema extrae información de los videos y genera archivos `.json` con los resultados, permitiendo procesamiento paralelo entre nodos.

### 3.1 Subir modelo YOLOv8

Asumiendo que el modelo `yolov8n.pt` está en tu directorio actual:

```bash
hdfs dfs -put yolov8n.pt /models/
```

> Revisa que ambos recursos se hayan subido correctamente con:

```bash
hdfs dfs -ls /videos_mp4
hdfs dfs -ls /models
```

![Ejecucion en Master](.docs/yolo.png)

### 3.2 Descripción de Proceso

- Se usa `process.py` para analizar videos mediante YOLOv8 y generar archivos `.json` con los objetos detectados.
- Para distribuir la carga en Hadoop Streaming, se implementó `holacopy.py`, que lee rutas de videos desde archivos `.txt` y las envía como input a los nodos.
- Cada nodo ejecuta un `daemon.py` que escucha nuevas rutas de videos desde un archivo local `/tmp/videos_a_procesar.txt` y lanza `process.py` cuando hay un nuevo video.
- El archivo `reducer.py` reporta qué videos se han procesado correctamente.
- Los `.json` generados por cada nodo se almacenan en una carpeta de salida dentro del HDFS.

### 3.3 Subir rutas de videos al HDFS

```bash
mkdir -p input_parts

for video in videos_mp4/*; do
  filename=$(basename "$video")
  echo "/videos_mp4/$filename" > "input_parts/${filename}.txt"
done

hdfs dfs -rm -r -f /input_parts
hdfs dfs -mkdir -p /input_parts
hdfs dfs -put input_parts/* /input_parts/
```

![Ejecucion en Master](.docs/txt_videos.png)

### 3.4 Ejecutar el trabajo MapReduce

```bash
hadoop jar $HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming*.jar \
  -files holacopy.py,reducer.py \
  -mapper holacopy.py \
  -reducer reducer.py \
  -input /input_parts \
  -output /output_resultados_yolo_$(date +%s)
```

### 3.5 Requisitos por nodo

```bash
python daemon.py &
rm /tmp/videos_a_procesar.txt
```

Este demonio estará en espera de nuevas rutas y ejecutará automáticamente el procesamiento.

![Ejecucion en Master](.docs/ejecucion_process.png)

### 3.6 Requisitos en el nodo maestro

Debe contener:

- `holacopy.py`
- `reducer.py`
- `process.py`
- `daemon.py`

El trabajo se lanza con:

```bash
hadoop jar $HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming*.jar \
  -files holacopy.py,reducer.py \
  -mapper holacopy.py \
  -reducer reducer.py \
  -input /input_parts \
  -output /output_resultados_yolo_$(date +%s)
```

![Ejecucion en Master](.docs/ejecucion_process_master.png)

### 3.7 Salidas

- Application job:
  ![Ejecucion en Master](.docs/app_process.png)

- HDFS:
  ![Ejecucion en Master](.docs/dir_process.png)
- Json in HDFS:
  ![Ejecucion en Master](.docs/json_process.png)
