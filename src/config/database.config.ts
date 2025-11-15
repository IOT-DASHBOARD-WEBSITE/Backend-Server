import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getDatabaseConfig = (): MongooseModuleOptions => {
  const mongoUri =
    process.env.NODE_ENV === 'development'
      ? process.env.MONGODB_URI_LOCAL ||
        'mongodb://admin:admin@localhost:27017/iot_db?authSource=admin'
      : process.env.MONGODB_URI ||
        'mongodb://admin:admin@mongo:27017/iot_db?authSource=admin';

  return {
    uri: mongoUri,
    retryAttempts: 5,
    retryDelay: 5000,
  };
};
