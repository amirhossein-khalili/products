import { CreateProductInitializedDto, ProductCreatedDto } from '../dtos';
import { BaseEvent } from './base-event';

export class CreateProductInitilizedEvent extends BaseEvent<CreateProductInitializedDto> {}
export class ProductCreatedEvent extends BaseEvent<ProductCreatedDto> {}
export { ProductSnapshotCreated } from './product-snapshot-created.event';
