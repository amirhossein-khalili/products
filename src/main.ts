import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
// import { MicroserviceOptions, Transport } from '@nestjs/microservices';
// import { ConfigService } from '@nestjs/config';
import { ProductsModule } from './products.module';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.RMQ,
  //   options: {
  //     urls: [configService.get<string>('RABBITMQ_URL')],
  //     queue: 'products_queue',
  //     queueOptions: { durable: true },
  //     prefetchCount: 10,
  //     noAck: false,
  //   },
  // });

  // await app.startAllMicroservices();
  await app.listen(3001);
}

bootstrap();
