import { Module, DynamicModule, Provider } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { ReconciliationCommand } from './commands/reconciliation.command';
import { ConfigRegistry } from './config';
import { ReconciliationModuleOptions } from './reconciliation-module-options.interface';
import { getModelToken, MongooseModule, SchemaFactory } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GenericMongooseRepository } from './persistance/generic-mongoose.repository';
import {
  EventStoreModule,
  redisCommonConf,
  RedisModule,
} from 'com.chargoon.cloud.svc.common';
import { AggregateReconstructor } from './services/aggregate-reconstructor.service';
import { CqrsModule } from '@nestjs/cqrs';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-store';

// Helper function to create a unique injection token for each dynamic repository
export const getReconciliationRepositoryToken = (aggregateName: string) =>
  `RECONCILIATION_REPOSITORY_${aggregateName.toUpperCase()}`;

@Module({
  imports: [
    CommandModule,
    RedisModule,
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
      subscriptions: {},
      transformers: {},
    }),
    CqrsModule,
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
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [{ name: 'EVENTS', type: 'topic' }],
        uri: configService.get<string>('RABBITMQ_URL'),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  providers: [ReconciliationCommand, AggregateReconstructor, ConfigRegistry],
})
export class ReconciliationModule {
  static forRoot(options: ReconciliationModuleOptions): DynamicModule {
    // Dynamically create a provider for each registered aggregate's repository
    // Instantiate the generic repository with the injected Mongoose model
    // Inject the Mongoose model corresponding to the aggregate class
    // const repositoryProviders: Provider[] = options.aggregates.map(
    //   (aggDef) => ({
    //     provide: getReconciliationRepositoryToken(aggDef.name),
    //     useFactory: (model: Model<any>) => {
    //       return new GenericMongooseRepository(model);
    //     },
    //     inject: [getModelToken(aggDef.config.schemaClass.name)],
    //   }),
    // );

    const configRegistryProvider: Provider = {
      provide: ConfigRegistry,
      useFactory: () => {
        const registry = new ConfigRegistry();
        options.aggregates.forEach((agg) => {
          registry.registerConfig(agg.name, agg.config);
        });
        return registry;
      },
    };

    return {
      module: ReconciliationModule,
      providers: [configRegistryProvider],
      // imports: [
      //   MongooseModule.forFeature(
      //     options.aggregates.map((aggDef) => ({
      //       name: aggDef.config.schemaClass.name,
      //       schema: SchemaFactory.createForClass(aggDef.config.schemaClass),
      //     })),
      //     'read_db',
      //   ),
      // ],
      exports: [ConfigRegistry],
    };
  }
}
