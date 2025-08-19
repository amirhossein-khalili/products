import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Inject } from '@nestjs/common';
import { EventsHandler } from '@nestjs/cqrs';
import { BaseEventHandler, IEventHandler } from 'com.chargoon.cloud.svc.common';
import { CreateProductInitilizedEvent } from 'src/domain/events';
import { IProductReadRepository } from 'src/domain/repositories/read-product.irepository';

@EventsHandler(CreateProductInitilizedEvent)
export class CreateProductInitilizedEventHandler
  extends BaseEventHandler
  implements IEventHandler<CreateProductInitilizedEvent>
{
  constructor(
    protected override readonly amqpConnection: AmqpConnection,

    @Inject('IProductReadRepository')
    protected readonly repository: IProductReadRepository,
  ) {
    super(amqpConnection);
  }

  handle(event: CreateProductInitilizedEvent) {
    this.logger.verbose('CreateProductInitilizedEventHandler');

    const { data, meta } = event;

    try {
      this.repository.save(data);
    } catch (error) {}
  }
}
