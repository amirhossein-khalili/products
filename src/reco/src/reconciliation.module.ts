import {
  DynamicModule,
  Module,
  Provider,
  Controller,
  Type,
  Inject,
} from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ReconciliationRepository } from './infrastructure';
import { ReconciliationController } from './interfaces/reconciliation.controller';
import {
  ReconciliationService,
  ReconciliationModuleOptions,
  AggregateReconstructor,
  StateComparator,
  ReconciliationCliConfig,
  ReconciliationCommand,
  ActionQuestion,
  NameQuestion,
} from './application';
import {
  AGGREGATE_RECONSTRUCTOR,
  AGGREGATE_ROOT,
  RECONCILIATION_SERVICE_PORT,
  STATE_COMPARATOR,
  TO_COMPARABLE_STATE,
  EVENT_TRANSFORMERS,
  AGGREGATE_NAME,
} from './application/constants/tokens';
import { ReconciliationRegistry } from './application/services/reconciliation-registry.service';
import { ReconciliationRegistrator } from './application/services/reconciliation-registrator.service';
import {
  EventStoreService,
  BaseAggregate,
  EventStoreModule,
} from 'com.chargoon.cloud.svc.common';
import { CliReportGenerator } from './application/services/cli-report-generator.service';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [],
})
export class ReconciliationModule {
  /**
   * Creates a new `RecoModule` for the root of the application.
   * This method should be called only once in the root module of the application.
   * @returns A `DynamicModule` object.
   */
  static forRoot(options: ReconciliationCliConfig): DynamicModule {
    const eventStoreModule = EventStoreModule.registerAsync({
      imports: [CqrsModule],
      inject: [],
      useFactory: async () => ({
        connectionString: options.eventStore.connectionString,
        channelCredentials: {
          insecure: true,
        },
        defaultUserCredentials: {
          username: options.eventStore.defaultUserCredentials.username,
          password: options.eventStore.defaultUserCredentials.password,
        },
        endpoint: {
          address: options.eventStore.endpoint.address,
          port: options.eventStore.endpoint.port,
        },
      }),
      subscriptions: {},
      transformers: options.eventStore.transformers,
    });
    const mongooseModule = MongooseModule.forRoot(options.mongo.uri);
    const featureImports = options.features.map((feature) =>
      ReconciliationModule.forFeature(feature),
    );

    return {
      module: ReconciliationModule,
      imports: [eventStoreModule, mongooseModule, ...featureImports],
      providers: [
        ReconciliationRegistry,
        ReconciliationCommand,
        ActionQuestion,
        NameQuestion,
        CliReportGenerator,
      ],
      exports: [ReconciliationRegistry],
      global: true,
    };
  }

  /**
   * Creates a new `RecoModule` for a feature of the application.
   * @param options The options for the feature module.
   * @returns A `DynamicModule` object.
   */
  static forFeature<T extends BaseAggregate>(
    options: ReconciliationModuleOptions<T>,
  ): DynamicModule {
    const DynamicRecoController = this.createDynamicController(options.path);

    const providers: Provider[] = [
      { provide: 'RECO_OPTIONS', useValue: options },
      { provide: TO_COMPARABLE_STATE, useValue: options.toComparableState },
      { provide: AGGREGATE_ROOT, useValue: options.aggregateRoot },
      { provide: EVENT_TRANSFORMERS, useValue: options.eventTransformers },
      { provide: AGGREGATE_NAME, useValue: options.aggregateName },

      {
        provide: ReconciliationRepository,
        useFactory: (model) => new ReconciliationRepository(model),
        inject: [getModelToken(options.name)],
      },
      { provide: STATE_COMPARATOR, useClass: StateComparator },

      {
        provide: AGGREGATE_RECONSTRUCTOR,
        useFactory: (
          eventStoreService: EventStoreService,
          aggregateName: string,
          aggregateRoot: Type<T>,
          eventTransformers: Record<string, (event: any) => any>,
        ) =>
          new AggregateReconstructor<T>(
            eventStoreService,
            aggregateName,
            aggregateRoot,
            eventTransformers,
          ),
        inject: [
          EventStoreService,
          AGGREGATE_NAME,
          AGGREGATE_ROOT,
          EVENT_TRANSFORMERS,
        ],
      },

      ReconciliationRegistrator,
    ];

    const recoServiceProvider: Provider = {
      provide: RECONCILIATION_SERVICE_PORT,
      useFactory: (
        aggregateReconstructor: AggregateReconstructor<T>,
        stateComparator: StateComparator,
        readRepository: ReconciliationRepository<any>,
        toComparableState: (aggregate: T) => any,
      ) =>
        new ReconciliationService(
          aggregateReconstructor,
          stateComparator,
          readRepository,
          toComparableState,
        ),
      inject: [
        AGGREGATE_RECONSTRUCTOR,
        STATE_COMPARATOR,
        ReconciliationRepository,
        TO_COMPARABLE_STATE,
      ],
    };

    providers.push(recoServiceProvider);

    return {
      module: ReconciliationModule,
      imports: [
        MongooseModule.forFeature([
          { name: options.name, schema: options.schema },
        ]),
      ],
      controllers: [DynamicRecoController],
      providers,
      exports: [recoServiceProvider],
    };
  }

  private static createDynamicController(path: string): Type<any> {
    @Controller(path + '/reconciliation')
    class DynamicController extends ReconciliationController {
      constructor(
        @Inject(RECONCILIATION_SERVICE_PORT) service: ReconciliationService,
        @Inject() recoRegistry: ReconciliationRegistry,
      ) {
        super(service, recoRegistry);
      }
    }
    return DynamicController;
  }
}
