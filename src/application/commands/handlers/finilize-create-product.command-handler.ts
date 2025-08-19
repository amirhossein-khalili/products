import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { BaseCommandHandler } from 'com.chargoon.cloud.svc.common/dist/base-command-handler';
import { domainInfo } from '../../../domain/utils';
import { FinilizeCreateProductCommand } from '../impls';
import { Product } from 'src/domain/entities/product.aggregate-root';
import { IProductWriteRepository } from 'src/domain/repositories/write-product.irepository';
import { FinilizeCreateProductDto } from 'src/domain/dtos/finilize-create-product.dto';

@CommandHandler(FinilizeCreateProductCommand)
export class FinalizeCreateProductHandler
  extends BaseCommandHandler
  implements ICommandHandler<FinilizeCreateProductCommand>
{
  protected override readonly logger = new Logger(
    FinalizeCreateProductHandler.name,
  );

  constructor(
    protected readonly publisher: EventPublisher,
    protected override readonly amqpConnection: AmqpConnection,
    @Inject('IProductsRepository')
    protected readonly repository: IProductWriteRepository,
  ) {
    super(amqpConnection);
  }

  async execute(command: FinilizeCreateProductCommand) {
    this.logger.verbose(`${FinalizeCreateProductHandler.name} executed.`);
    const { data, meta } = command;
    try {
      const product: Product = this.publisher.mergeObjectContext(
        await this.repository.findOneById(data.id, meta),
      );
      product.finalizeCreate(data, meta);
      product.commit();
    } catch (err) {
      await this.publishEvent<FinilizeCreateProductDto>({
        event: {
          evt: 'events.products.finalize_create_product_failed',
          data,
          meta,
        },
        messages: [
          {
            level: 'error',
            service: domainInfo().service,
            domain: domainInfo().domain,
            context: 'FinalizeCreateProduct',
            exception: err.name,
            message: err.message,
          },
        ],
        exception: err,
      });
    }
  }
}
