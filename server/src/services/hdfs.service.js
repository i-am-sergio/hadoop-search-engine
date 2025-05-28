import webhdfs from 'webhdfs';
import { Writable } from 'stream';

const hdfs = webhdfs.createClient({
  user: 'hadoop', // o el nombre de usuario de tu sistema HDFS
  host: 'paul',
  port: 9870,
  path: '/webhdfs/v1'
});

export const readHDFSFile = () => {
  return new Promise((resolve, reject) => {
    const remoteFilePath = '/user/hadoop/outputJson/part-r-00000';
    let fileContent = '';

    const writable = new Writable({
      write(chunk, encoding, callback) {
        fileContent += chunk.toString();
        callback();
      }
    });

    hdfs.createReadStream(remoteFilePath)
      .on('error', err => {
        console.error('Error al leer el archivo:', err);
        reject(err);
      })
      .pipe(writable)
      .on('finish', () => {
        console.log('Contenido del archivo HDFS:');
        console.log(fileContent);
        resolve(fileContent);
      });
  });
};
