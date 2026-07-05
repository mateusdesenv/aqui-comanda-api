import { env } from './env';

export const databaseConfig = {
  uri: env.MONGO_URI,
  dbName: env.MONGO_DB_NAME,
  serverSelectionTimeoutMS: 8000,
};
