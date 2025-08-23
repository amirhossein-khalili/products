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
import { CacheModule } from '@nestjs/cache-manager';
import type { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-store';
import {
  EventStoreModule,
  redisCommonConf,
  RedisModule,
} from 'com.chargoon.cloud.svc.common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ProductWriteRepository } from './infrastructure/repositories/write-product.repository';
import { productsTransformers } from './products.transformers';
import { RecoService } from './interfaces/reco/reco.service';
import { RecoController } from './interfaces/reco/reco.controller';
import { AggregateReconstructor } from './interfaces/reco/services/aggregate-reconstructor.service';
import { StateComparator } from './interfaces/reco/services/state-comparator.service';
import { ProductRecoRepository } from './interfaces/reco/repo/products/product-reco.repository';

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
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    CqrsModule,

    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [{ name: 'EVENTS', type: 'topic' }],
        uri: configService.get<string>('RABBITMQ_URL'),
        connectionInitOptions: { wait: false },
      }),
    }),

    EventStoreModule.registerAsync({
      imports: [ConfigModule, CqrsModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connectionString: configService.get<string>(
          'EVENTSTORE_CONNECTION_STRING',
        ),
        channelCredentials: {
          insecure: true,
        },
        defaultUserCredentials: {
          username: configService.get<string>('EVENTSTORE_USERNAME', 'admin'),
          password: configService.get<string>(
            'EVENTSTORE_PASSWORD',
            'changeit',
          ),
        },
        endpoint: {
          address: configService.get<string>(
            'EVENTSTORE_HOSTNAME',
            'localhost',
          ),
          port: configService.get<string>('EVENTSTORE_PORT', '2113'),
        },
      }),
      subscriptions: {
        corr_products: '$ce-corr_products',
      },
      transformers: { ...productsTransformers },
    }),

    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST'),
            port: configService.get<number>('REDIS_PORT'),
          },
        }),
        ttl: configService.get<number>('CACHE_TTL'),
      }),
    }),

    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        config: redisCommonConf(configService),
      }),
    }),

    MongooseModule.forRootAsync({
      connectionName: 'read_db',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('QUERY_DATABASE_URL') ??
          'mongodb://localhost:27017/app_read',
      }),
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

    EventStoreModule.registerAsync({
      imports: [ConfigModule, CqrsModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connectionString: configService.get<string>(
          'EVENTSTORE_CONNECTION_STRING',
        ),

        subscriptions:
          process.env.RUN_CONTEXT === 'CLI'
            ? {}
            : {
                corr_products: '$ce-corr_products',
              },

        transformers: { ...productsTransformers },
      }),
    }),
  ],
  providers: [
    ...Object.values(CommandHandlers),
    ...Object.values(EventHandlers),
    ...Repositories,
    RecoService,
    AggregateReconstructor,
    StateComparator,
    ProductRecoRepository,
  ],
  controllers: [ProductsController, RecoController],
})
export class ProductsModule {}
