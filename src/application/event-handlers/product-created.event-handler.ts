import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject, Logger } from '@nestjs/common';
import { Command, EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { BaseEventHandler } from 'com.chargoon.cloud.svc.common/dist/base-event-handler';
import { CreateProductFailed, ProductCreatedEvent } from 'src/domain/events';
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
    const { data, meta } = event;
    // try {
    await this.repository.save(data);
    // } catch (err) {
    //   this.logger.error(err.message);
    //   await this.emitEvent(
    //     'events.corr_exchange_registries.update_exchange_registry_failed',
    //     data,
    //     meta,
    //   );
    // new CreateProductFailed(),
    // );
    // }
  }
}
