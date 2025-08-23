import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductReadRepository } from './infrastructure/repositories/read-product.repository';
import { ProductsController } from './interfaces/products.controller';
import {
  PRODUCT_READ_REPOSITORY,
  PRODUCT_WRITE_REPOSITORY,
} from './domain/repositories/injection-tokens';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductSchema,
  ProductSchemaFactory,
} from './infrastructure/schemas/product.schema';
import * as EventHandlers from './application/event-handlers';
import * as CommandHandlers from './application/commands/handlers';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventStoreModule } from 'com.chargoon.cloud.svc.common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ProductWriteRepository } from './infrastructure/repositories/write-product.repository';
import { RecoModule } from './reco/reco.module';

const pkg = require('../package.json');

const Repositories: Provider[] = [
  {
    provide: PRODUCT_WRITE_REPOSITORY,
    useClass: ProductWriteRepository,
  },
  {
    provide: PRODUCT_READ_REPOSITORY,
    useClass: ProductReadRepository,
  },
];

@Module({
  imports: [
    RecoModule.forFeature({
      name: 'productschemas',
      schema: ProductSchemaFactory,
      path: 'products',
      connectionName: 'read_db', // مشخص کردن نام connection
    }),

    MongooseModule.forFeature(
      [
        {
          name: ProductSchema.name,
          schema: ProductSchemaFactory,
        },
      ],
      'read_db',
    ),

    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [{ name: 'EVENTS', type: 'topic' }],
        uri: configService.get<string>('RABBITMQ_URL'),
        connectionInitOptions: { wait: false },
      }),
    }),

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    CqrsModule,

    EventStoreModule,
  ],
  providers: [
    ...Object.values(CommandHandlers),
    ...Object.values(EventHandlers),
    ...Repositories,
  ],
  controllers: [ProductsController],
})
export class ProductsModule {}
