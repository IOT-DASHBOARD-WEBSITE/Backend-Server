import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Load environment variables explicitly
dotenv.config({ path: '.env' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Enable CORS - allow localhost, ngrok, and Cloudflare tunnel URLs
  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean);
  
  // Allow ngrok and Cloudflare tunnel URLs (pattern matching)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Allow localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      // Allow ngrok URLs
      if (origin.includes('ngrok-free.app') || origin.includes('ngrok.io')) {
        return callback(null, true);
      }
      
      // Allow Cloudflare tunnel URLs
      if (origin.includes('trycloudflare.com') || origin.includes('cloudflare.com')) {
        return callback(null, true);
      }
      
      // Allow configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      callback(null, true); // Allow all for now (can restrict later)
    },
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`✅ Backend running on http://localhost:${port}`);
}
void bootstrap();
