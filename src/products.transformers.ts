import {
  CreateProductInitilizedEvent,
  ProductCreatedEvent,
  ProductSnapshotCreated,
} from './domain/events';

export const productsTransformers = <const>{
  ProductSnapshotCreated: (event: any) =>
    new ProductSnapshotCreated(event.data, event.meta),

  ProductCreatedEvent: (event: any) =>
    new ProductCreatedEvent(event.data, event.meta),

  CreateProductInitilizedEvent: (event: any) =>
    new CreateProductInitilizedEvent(event.data, event.meta),
};
