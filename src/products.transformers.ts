import {
  ProductCreatedEvent,
  CreateProductFailed,
  ProductSnapshotCreated,
} from './domain/events';

export const productsTransformers = <const>{
  ProductSnapshotCreated: (event: any) =>
    new ProductSnapshotCreated(event.data, event.meta),

  CreateProductFailed: (event: any) =>
    new CreateProductFailed(event.data, event.meta),

  ProductCreatedEvent: (event: any) =>
    new ProductCreatedEvent(event.data, event.meta),
};
