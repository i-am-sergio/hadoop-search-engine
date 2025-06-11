// src/service/hiveService.js
import hive from 'hive-driver';
const { TCLIService, TCLIService_types } = hive.thrift;

const client = new hive.HiveClient(
  TCLIService,
  TCLIService_types
);

const connectToHive = async () => {
  const connection = client.connect(
    {
      host: 'localhost',
      port: 10000
    },
    new hive.connections.TcpConnection(),
    new hive.auth.NoSaslAuthentication()
  );

  const hiveClient = await connection;

  const session = await hiveClient.openSession({
    client_protocol: TCLIService_types.TProtocolVersion.HIVE_CLI_SERVICE_PROTOCOL_V10
  });

  return session;
};

export const getWordCounts = async () => {
  const session = await connectToHive();
  const statement = await session.executeStatement("SELECT * FROM word_counts");
  const fetch = await statement.fetchAll();
  const data = fetch.getValue();
  await session.close();
  return data;
};
