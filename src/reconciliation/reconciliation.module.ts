import { Module, DynamicModule, Provider } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { ReconciliationCommand } from './commands/reconciliation.command';
import { ConfigRegistry, AggregateConfig } from './config';
import { ReconciliationModuleOptions } from './reconciliation-module-options.interface';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GenericMongooseRepository } from './persistance/generic-mongoose.repository';

// Helper function to create a unique injection token for each dynamic repository
export const getReconciliationRepositoryToken = (aggregateName: string) =>
  `RECONCILIATION_REPOSITORY_${aggregateName.toUpperCase()}`;

@Module({})
export class ReconciliationModule {
  static forRoot(options: ReconciliationModuleOptions): DynamicModule {
    // Dynamically create a provider for each registered aggregate's repository
    // Instantiate the generic repository with the injected Mongoose model
    // Inject the Mongoose model corresponding to the aggregate class
    const repositoryProviders: Provider[] = options.aggregates.map(
      (aggDef) => ({
        provide: getReconciliationRepositoryToken(aggDef.name),
        useFactory: (model: Model<any>) => {
          return new GenericMongooseRepository(model);
        },
        inject: [getModelToken(aggDef.config.aggregateClass.name)],
      }),
    );

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
      imports: [CommandModule],
      providers: [
        configRegistryProvider,
        ReconciliationCommand,
        ...repositoryProviders,
      ],
      exports: [ConfigRegistry, ...repositoryProviders],
    };
  }
}
