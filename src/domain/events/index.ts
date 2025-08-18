import { ProductCreatedDto, CreateProductFailedDto } from '../dtos';
import { BaseEvent } from './base-event';

export class ProductCreatedEvent extends BaseEvent<ProductCreatedDto> {}
export class CreateProductFailed extends BaseEvent<CreateProductFailedDto> {}
export { ProductSnapshotCreated } from './product-snapshot-created.event';
