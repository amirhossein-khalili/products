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
import { Schema } from 'mongoose';

export interface RecoModuleOptions {
  name: string;
  schema: Schema;
  path: string;
  connectionName?: string;
}

@Module({})
export class RecoModule {
  static forFeature(options: RecoModuleOptions): DynamicModule {
    const DynamicRecoController = this.createDynamicController(options.path);

    // تعیین نام connection - اگر مشخص نشده باشد از default استفاده می‌شود
    const connectionName = options.connectionName || undefined;

    // تعیین token مدل با در نظر گیری connection name
    const modelToken = connectionName
      ? getModelToken(options.name, connectionName)
      : getModelToken(options.name);

    const recoServiceProvider: Provider = {
      provide: RecoService,
      useFactory: (model) => {
        return new RecoService(model);
      },
      inject: [modelToken], // استفاده از token درست
    };

    return {
      module: RecoModule,
      imports: [
        MongooseModule.forFeature(
          [{ name: options.name, schema: options.schema }],
          connectionName,
        ), // مشخص کردن connection name
      ],
      controllers: [DynamicRecoController],
      providers: [recoServiceProvider],
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
