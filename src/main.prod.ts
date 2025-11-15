import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  // Use minimal NestJS features for production
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'], // Reduce logging
  });

  // Minimal validation to save memory
  app.useGlobalPipes(new ValidationPipe({
    transform: false,
    whitelist: false,
    forbidNonWhitelisted: false,
  }));

  // Minimal CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`✅ Production backend running on port ${port}`);
}
void bootstrap();
