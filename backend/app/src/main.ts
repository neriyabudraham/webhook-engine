// --- FIX FOR NODE 18 & NESTJS SCHEDULE ---
const crypto = require('crypto');
global.crypto = crypto;
// -----------------------------------------

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // הגדרות CORS (מהשלבים הקודמים)
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
