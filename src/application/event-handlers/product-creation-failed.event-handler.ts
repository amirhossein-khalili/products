import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { CreateProductFailed } from 'src/domain/events';
import { Logger } from '@nestjs/common';

@EventsHandler(CreateProductFailed)
export class ProductCreationFailedHandler
  implements IEventHandler<CreateProductFailed>
{
  private readonly logger = new Logger(ProductCreationFailedHandler.name);

  async handle(event: CreateProductFailed) {
    const { id, error } = event.data;
    this.logger.error(
      `Failed to create product with tentative ID: ${id}. Reason: ${error.message}`,
      error.stack,
    );
  }
}
