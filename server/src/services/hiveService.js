// src/service/hiveService.js
import hive from 'hive-driver';
const { TCLIService, TCLIService_types } = hive.thrift;

const client = new hive.HiveClient(
  TCLIService,
  TCLIService_types
);

const connectToHive = async () => {
  console.log("Conectando a Hive...");

  try {
    const connection = await Promise.race([
      client.connect(
        {
          host: 'localhost',
          port: 10000
        },
        new hive.connections.TcpConnection(),
        new hive.auth.NoSaslAuthentication()
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: Hive no respondió en 10 segundos")), 10000)
      )
    ]);

    console.log("Conexión establecida, abriendo sesión...");

    const session = await Promise.race([
      connection.openSession({
        client_protocol: TCLIService_types.TProtocolVersion.HIVE_CLI_SERVICE_PROTOCOL_V10
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: openSession tardó demasiado")), 10000)
      )
    ]);

    console.log("Sesión abierta");

    return session;

  } catch (err) {
    console.error("Error al conectar o abrir sesión en Hive:", err.message);
    throw err;
  }
};


export const getWordCounts = async () => {
  try {
    const session = await connectToHive();

    console.log("Ejecutando consulta...");
    const statement = await session.executeStatement("SELECT * FROM word_counts");
    console.log("Consulta ejecutada");

    const fetch = await statement.fetchAll();
    console.log("Datos obtenidos");

    const data = fetch.getValue();
    console.log("Resultado:", data);

    await session.close();
    console.log("Sesión cerrada");

    return data;
  } catch (error) {
    console.error("Error en getWordCounts:", error.message);
    throw error;
  }
};
