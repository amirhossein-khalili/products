import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Logger } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { BaseEventHandler } from 'com.chargoon.cloud.svc.common/dist/base-event-handler';
import { ProductCreatedEvent } from 'src/domain/events';
import { IProductReadRepository } from 'src/domain/repositories/read-product.irepository';

@EventsHandler(ProductCreatedEvent)
export class ProductCreatedHandler
  extends BaseEventHandler
  implements IEventHandler<ProductCreatedEvent>
{
  constructor(
    protected override readonly amqpConnection: AmqpConnection,
    @Inject('IProductReadRepository')
    protected readonly repository: IProductReadRepository,
    private readonly eventBus: EventBus,
  ) {
    super(amqpConnection);
  }

  protected override readonly logger = new Logger(ProductCreatedHandler.name);

  async handle(event: ProductCreatedEvent) {
    this.logger.verbose(`${this.constructor.name} handled.`);

    try {
      const { data } = event;

      this.repository.save(data);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
