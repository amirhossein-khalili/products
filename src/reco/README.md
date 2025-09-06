# Reco Module

The `reco` module provides a flexible and extensible framework for data reconciliation within the application. It is designed to identify and fix discrepancies between different data sources, such as an event store and a read model.

## Key Features

- **Automated Discrepancy Checks:** Automatically compare data between sources to find mismatches.
- **Data-Fixing Capabilities:** Apply corrections to the read model to align it with the event store.
- **Flexible Configuration:** Easily configure the module for different data models and entities.
- **CLI for Manual Operations:** A command-line interface to manually trigger checks and fixes.
- **Extensible:** Designed to be extended with custom logic for specific reconciliation needs.

## Getting Started

To use the `reco` module, you need to import it into your application's root module and feature modules.

### Root Module

In your root module, import `RecoModule` and call the `forRoot()` method:

```typescript
import { Module } from '@nestjs/common';
import { RecoModule } from 'path/to/reco.module';

@Module({
  imports: [RecoModule.forRoot()],
})
export class AppModule {}
```

### Feature Module

In your feature modules, import `RecoModule` and call the `forFeature()` method with the appropriate options:

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

## CLI Usage

The `reco` module includes a CLI for manual reconciliation tasks. You can run the CLI with the following command:

```bash
npm run cli -- reco
```

The CLI will prompt you for the action you want to perform (check or fix) and the name of the module you want to run the action on.
