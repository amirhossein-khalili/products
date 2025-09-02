# Services

This document provides an overview of the services in this application.

## Reconciliation Service (`RecoService`)

The `RecoService` is the core service of the application. It provides the following functionality:

*   **Checking for discrepancies:** The service can check for discrepancies between the data in the event store and the data in the read model.
*   **Fixing discrepancies:** The service can fix discrepancies by updating the data in the read model to match the data in the event store.

The service can be used to check or fix a single entity, a batch of entities, or all entities.

## Aggregate Reconstructor (`AggregateReconstructor`)

The `AggregateReconstructor` is a service that is used to reconstruct an aggregate from its event stream. The service reads the events from the event store and applies them to an aggregate to bring it to its current state.

## State Comparator (`StateComparator`)

The `StateComparator` is a service that is used to compare two states and return the result of the comparison. The service uses the `deep-diff` library to perform a deep comparison of the two states.

## Reconciliation Registry (`RecoRegistry`)

The `RecoRegistry` is a service that is used to keep track of all the reconciliation modules that are registered in the application. The service provides a way to get a list of all the registered modules and to get a specific module by its name.

## Reconciliation Registrator (`RecoRegistrator`)

The `RecoRegistrator` is a service that is used to register a reconciliation module in the `RecoRegistry`. The service is automatically called when a reconciliation module is initialized.

## CLI Report Generator (`CliReportGenerator`)

The `CliReportGenerator` is a service that is used to generate a report of the reconciliation results in Excel format. The service is used by the CLI to generate a report when the `reco` command is run.

# `RecoModule`

The `RecoModule` is a dynamic module that can be used to add reconciliation functionality to a feature module.

## `forRoot`

The `forRoot` method should be called in the root module of the application. It registers the `RecoRegistry` as a global provider.

```typescript
import { Module } from '@nestjs/common';
import { RecoModule } from 'path/to/reco.module';

@Module({
  imports: [RecoModule.forRoot()],
})
export class AppModule {}
```

## `forFeature`

The `forFeature` method should be called in a feature module. It registers the reconciliation service and all its dependencies.

```typescript
import { Module } from '@nestjs/common';
import { RecoModule } from 'path/to/reco.module';
import { MyAggregate } from 'path/to/my.aggregate';
import { MySchema } from 'path/to/my.schema';

@Module({
  imports: [
    RecoModule.forFeature({
      name: 'my-feature',
      schema: MySchema,
      path: 'my-feature',
      toComparableState: (aggregate: MyAggregate) => {
        // Return a comparable state from the aggregate
      },
      aggregateRoot: MyAggregate,
      aggregateName: 'MyAggregate',
      eventTransformers: {
        // A map of event transformers
      },
    }),
  ],
})
export class MyFeatureModule {}
```
