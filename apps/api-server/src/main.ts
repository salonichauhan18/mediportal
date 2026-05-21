import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { Logger } from 'nestjs-pino';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { PrismaService } from './modules/prisma/prisma.service';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  // Use pino logger
  app.useLogger(app.get(Logger));
  
  // Security Hardening
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: '*', // In production, replace with specific domains
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  const prismaService = app.get(PrismaService);
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new TenantInterceptor(prismaService)
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('MediPortal Enterprise v2.0')
    .setDescription('The Unified Clinical & Intelligence Engine for Modern Healthcare.')
    .setVersion('2.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
