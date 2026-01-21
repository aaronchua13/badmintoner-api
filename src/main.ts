import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors();

  // Performance
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(compression());

  // Global Config
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: await app.getUrl()`);
  logger.log(`Server running on port ${port}`);
}
bootstrap();
