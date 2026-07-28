import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  Logger.log(`🚀 Restaurant OS Kazakhstan Backend is running on: http://localhost:${port}`, 'Bootstrap');
  Logger.log(`🔗 Nexium POS Webhook endpoint: http://localhost:${port}/api/v1/nexium/webhook`, 'Bootstrap');
}
bootstrap();
