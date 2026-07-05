import mongoose from 'mongoose';
import { databaseConfig } from '../config/database';

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(databaseConfig.uri, {
        dbName: databaseConfig.dbName,
        serverSelectionTimeoutMS: databaseConfig.serverSelectionTimeoutMS,
      })
      .then((connection) => {
        console.log(`[database] MongoDB conectado em ${databaseConfig.dbName}`);
        return connection;
      })
      .catch((error) => {
        connectionPromise = null;
        console.error('[database] Falha ao conectar no MongoDB:', error.message);
        throw error;
      });
  }

  return connectionPromise;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  connectionPromise = null;
}
