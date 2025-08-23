// reco.module.ts
import {
  DynamicModule,
  Module,
  Provider,
  Controller,
  Type,
} from '@nestjs/common';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { RecoController } from './reco.controller';
import { RecoService } from './reco.service';
import { RecoModuleOptions } from './interfaces/reco-module-options.interface';
import { ReconciliationRepository } from './repositories/reconciliation.repository';

@Module({})
export class RecoModule {
  static forFeature(options: RecoModuleOptions): DynamicModule {
    const DynamicRecoController = this.createDynamicController(options.path);

    const modelToken = getModelToken(options.name);

    // Create repository provider
    const repositoryProvider: Provider = {
      provide: ReconciliationRepository,
      useFactory: (model) => {
        return new ReconciliationRepository(model);
      },
      inject: [modelToken],
    };

    const providers: Provider[] = [repositoryProvider];
    const injectTokens: any[] = [ReconciliationRepository];

    // Conditionally add write repository provider
    if (options.writeRepository) {
      const writeRepositoryToken = options.writeRepoToken || 'WRITE_REPOSITORY';

      const writeRepositoryProvider: Provider = {
        provide: writeRepositoryToken,
        useClass: options.writeRepository,
      };

      providers.push(writeRepositoryProvider);
      injectTokens.push(writeRepositoryToken);
    }

    // Conditionally add toComparableState provider
    if (options.toComparableState) {
      const toComparableStateProvider: Provider = {
        provide: 'TO_COMPARABLE_STATE',
        useValue: options.toComparableState,
      };

      providers.push(toComparableStateProvider);
      injectTokens.push('TO_COMPARABLE_STATE');
    }

    // Update service provider
    const recoServiceProvider: Provider = {
      provide: RecoService,
      useFactory: (...args: any[]) => {
        const repository = args[0];
        const writeRepository = args[1]; // Will be undefined if not provided
        const toComparableState = args[2]; // Will be undefined if not provided

        return new RecoService(repository, writeRepository, toComparableState);
      },
      inject: injectTokens,
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
    class DynamicController extends RecoController<any> {
      constructor(service: RecoService<any>) {
        super(service);
      }
    }
    return DynamicController;
  }
}
