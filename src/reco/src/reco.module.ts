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
import { WriteRepository } from './domain';
import {
  AGGREGATE_RECONSTRUCTOR,
  AGGREGATE_ROOT,
  RECO_SERVICE_PORT,
  STATE_COMPARATOR,
  TO_COMPARABLE_STATE,
  WRITE_REPOSITORY,
} from './application/constants/tokens';
import { RecoRegistry } from './application/services/reco-registry.service';
import { RecoRegistrator } from './application/services/reco-registrator.service';

@Module({})
export class RecoModule {
  static forRoot(): DynamicModule {
    return {
      module: RecoModule,
      providers: [RecoRegistry],
      exports: [RecoRegistry],
      global: true,
    };
  }

  static forFeature<T = any>(options: RecoModuleOptions<T>): DynamicModule {
    const DynamicRecoController = this.createDynamicController(options.path);

    const writeRepositoryToken = options.writeRepoToken || WRITE_REPOSITORY;

    const providers: Provider[] = [
      // ---- Configuration Value Providers ----
      { provide: 'RECO_OPTIONS', useValue: options },
      { provide: TO_COMPARABLE_STATE, useValue: options.toComparableState },
      { provide: AGGREGATE_ROOT, useValue: options.aggregateRoot },
      // ----  Infrastructure Providers ----
      {
        provide: ReconciliationRepository,
        useFactory: (model) => new ReconciliationRepository(model),
        inject: [getModelToken(options.name)],
      },
      { provide: STATE_COMPARATOR, useClass: StateComparator },
      // ----  Application Service Providers ----
      {
        provide: AGGREGATE_RECONSTRUCTOR,
        useFactory: (writeRepository: WriteRepository<T>) =>
          new AggregateReconstructor<T>(writeRepository),
        inject: [writeRepositoryToken],
      },
      // ---- Registration Service ----
      RecoRegistrator,
    ];

    if (options.writeRepository) {
      providers.push({
        provide: writeRepositoryToken,
        useClass: options.writeRepository,
      });
    }

    //  ---- Main Service Provider ----
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
      constructor(@Inject(RECO_SERVICE_PORT) service: RecoService) {
        super(service);
      }
    }

    return DynamicController;
  }
}
