import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Initialize NestJS application using Fastify Engine on Bun.js
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  // Enable CORS for JS Admin Dashboard and Mobile POS Clients
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Pipeline Validation for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Setup Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('Unified POS & SaaS Backend Engine (Bun.js)')
    .setDescription(
      'API documentation for Mobile POS Cashier App and JS Platform Super Admin Dashboard',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'Firebase-JWT',
    )
    .addApiKey({ type: 'apiKey', name: 'X-Business-ID', in: 'header' }, 'X-Business-ID')
    .addApiKey({ type: 'apiKey', name: 'X-Location-ID', in: 'header' }, 'X-Location-ID')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`================================──────────────────────────────`);
  logger.log(`⚡ POS & SaaS Backend Engine Running on Bun.js at: http://localhost:${port}`);
  logger.log(`📚 Interactive Swagger OpenAPI Docs Available at: http://localhost:${port}/docs`);
  logger.log(`================================──────────────────────────────`);
}

bootstrap();
