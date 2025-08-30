import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
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
import { productsTransformers } from './products.transformers';
import { ProductsModule } from './products.module';
import { RecoModule } from './reco/src/reco.module';

@Module({
  imports: [
    ProductsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    RecoModule.forRoot(),

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
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_CONNECTION_STRING'),
      }),
    }),
  ],
  providers: [],
})
export class AppModule {}
