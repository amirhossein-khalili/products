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

export const STATE_COMPARATOR_TOKEN = 'STATE_COMPARATOR';
export const AGGREGATE_RECONSTRUCTOR_TOKEN = 'AGGREGATE_RECONSTRUCTOR';
export const RECO_SERVICE_PORT_TOKEN = 'RecoServicePort';

@Module({})
export class RecoModule {
  static forFeature<T = any>(options: RecoModuleOptions<T>): DynamicModule {
    const DynamicRecoController = this.createDynamicController(options.path);

    const writeRepositoryToken = options.writeRepoToken || 'WRITE_REPOSITORY';

    const providers: Provider[] = [
      // Infrastructure Providers
      {
        provide: ReconciliationRepository,
        useFactory: (model) => new ReconciliationRepository(model),
        inject: [getModelToken(options.name)],
      },
      {
        provide: STATE_COMPARATOR_TOKEN,
        useClass: StateComparator,
      },
      // Application Service Providers
      {
        provide: AGGREGATE_RECONSTRUCTOR_TOKEN,
        useFactory: (writeRepository: WriteRepository<T>) =>
          new AggregateReconstructor<T>(writeRepository),
        inject: [writeRepositoryToken],
      },
      // Configuration Value Providers
      {
        provide: 'TO_COMPARABLE_STATE',
        useValue: options.toComparableState,
      },
      {
        provide: 'AGGREGATE_ROOT',
        useValue: options.aggregateRoot,
      },
    ];

    if (options.writeRepository) {
      providers.push({
        provide: writeRepositoryToken,
        useClass: options.writeRepository,
      });
    }

    // Main Service Provider (The Port Implementation)
    const recoServiceProvider: Provider = {
      provide: RECO_SERVICE_PORT_TOKEN,
      useFactory: (
        aggregateReconstructor: AggregateReconstructor<T>,
        stateComparator: StateComparator,
        // --- FIX 1: Add the required generic type argument ---
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
        AGGREGATE_RECONSTRUCTOR_TOKEN,
        STATE_COMPARATOR_TOKEN,
        ReconciliationRepository,
        'TO_COMPARABLE_STATE',
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
      // --- FIX 2: Use the @Inject decorator for clarity and correctness ---
      // This is the standard NestJS way to inject a provider using a token.
      constructor(@Inject(RECO_SERVICE_PORT_TOKEN) service: RecoService) {
        super(service);
      }
    }

    return DynamicController;
  }
}
