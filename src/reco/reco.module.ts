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

    const repositoryProvider: Provider = {
      provide: ReconciliationRepository,
      useFactory: (model) => {
        return new ReconciliationRepository(model);
      },
      inject: [modelToken],
    };

    const recoServiceProvider: Provider = {
      provide: RecoService,
      useFactory: (repository: ReconciliationRepository<any>) => {
        return new RecoService(repository);
      },
      inject: [ReconciliationRepository],
    };

    return {
      module: RecoModule,
      imports: [
        MongooseModule.forFeature([
          { name: options.name, schema: options.schema },
        ]),
      ],
      controllers: [DynamicRecoController],
      providers: [repositoryProvider, recoServiceProvider],
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
