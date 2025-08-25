import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductReadRepository } from './infrastructure/repositories/read-product.repository';
import {
  PRODUCT_READ_REPOSITORY,
  PRODUCT_WRITE_REPOSITORY,
} from './domain/repositories/injection-tokens';
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
import { SchedulerModule } from 'com.chargoon.cloud.svc.common/dist/scheduler';
import { mongo } from 'mongoose';
import { ProductsModule } from './products.module';

const pkg = require('../package.json');

@Module({
  imports: [
    ProductsModule,

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
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_CONNECTION_STRING'),
      }),
    }),

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

    SchedulerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        name: pkg.name,
        ensureIndex: true,
        mongo: new mongo.MongoClient(
          configService.get<string>('MONGODB_CONNECTION_STRING') ||
            'mongodb://' +
              `${encodeURIComponent(configService.get<string>('MONGODB_USERNAME', 'admin'))}:` +
              `${encodeURIComponent(configService.get<string>('MONGODB_PASSWORD', '1'))}@` +
              `${configService.get<string>('MONGODB_HOSTNAME', 'localhost')}:` +
              `${configService.get<number>('MONGODB_PORT', 27017)}/?replicaSet=` +
              `${configService.get<string>('MONGODB_REPLICASET', 'rs0')}` +
              `&directConnection=${configService.get<string>('MONGODB_DIRECT', 'false')}` +
              `&readPreference=${configService.get<string>('MONGODB_READ_PREFERENCE', 'primary')}`,
        ).db('db-scheduler'),
        db: {
          collection: 'jobs',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [],
})
export class AppModule {}
