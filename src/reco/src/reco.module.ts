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
import { RecoController } from './interfaces/reco.controller';
import {
  RecoService,
  RecoModuleOptions,
  AggregateReconstructor,
  StateComparator,
} from './application';
import {
  AGGREGATE_RECONSTRUCTOR,
  AGGREGATE_ROOT,
  RECO_SERVICE_PORT,
  STATE_COMPARATOR,
  TO_COMPARABLE_STATE,
  EVENT_TRANSFORMERS,
  AGGREGATE_NAME,
} from './application/constants/tokens';
import { RecoRegistry } from './application/services/reco-registry.service';
import { RecoRegistrator } from './application/services/reco-registrator.service';
import {
  EventStoreService,
  BaseAggregate,
} from 'com.chargoon.cloud.svc.common';
import { CliReportGenerator } from './application/services/cli-report-generator.service';
import { ActionQuestion, NameQuestion } from './application/cli/reco.questions';
import { RecoCommand } from './application/cli/reco-command';

@Module({
  imports: [],
  // providers: [RecoCommand, ActionQuestion, NameQuestion, CliReportGenerator],
})
export class RecoModule {
  /**
   * Creates a new `RecoModule` for the root of the application.
   * This method should be called only once in the root module of the application.
   * @returns A `DynamicModule` object.
   */
  static forRoot(): DynamicModule {
    return {
      module: RecoModule,
      providers: [
        RecoRegistry,
        RecoCommand,
        ActionQuestion,
        NameQuestion,
        CliReportGenerator,
      ],
      exports: [RecoRegistry],
      global: true,
    };
  }

  /**
   * Creates a new `RecoModule` for a feature of the application.
   * @param options The options for the feature module.
   * @returns A `DynamicModule` object.
   */
  static forFeature<T extends BaseAggregate>(
    options: RecoModuleOptions<T>,
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

      RecoRegistrator,
    ];

    const recoServiceProvider: Provider = {
      provide: RECO_SERVICE_PORT,
      useFactory: (
        aggregateReconstructor: AggregateReconstructor<T>,
        stateComparator: StateComparator,
        readRepository: ReconciliationRepository<any>,
        toComparableState: (aggregate: T) => any,
      ) =>
        new RecoService(
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
      module: RecoModule,
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
    @Controller(path + '/reco')
    class DynamicController extends RecoController {
      constructor(
        @Inject(RECO_SERVICE_PORT) service: RecoService,
        @Inject() recoRegistry: RecoRegistry,
      ) {
        super(service, recoRegistry);
      }
    }
    return DynamicController;
  }
}
