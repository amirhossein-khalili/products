import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateProductCommand } from '../impls';
import { Logger, Inject } from '@nestjs/common';
import { BaseCommandHandler } from 'com.chargoon.cloud.svc.common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { IProductWriteRepository } from '../../../domain/repositories/write-product.irepository';
import { PRODUCT_WRITE_REPOSITORY } from '../../../domain/repositories/injection-tokens';
import { domainInfo } from '../../../domain/utils';

/**
 * Handles the `CreateProductCommand`.
 *
 * This command handler is responsible for creating a new product.
 */
@CommandHandler(CreateProductCommand)
export class CreateProductHandler
  extends BaseCommandHandler
  implements ICommandHandler<CreateProductCommand>
{
  protected override readonly logger = new Logger(CreateProductHandler.name);

  constructor(
    protected readonly publisher: EventPublisher,
    protected override readonly amqpConnection: AmqpConnection,
    protected readonly configService: ConfigService,
    @Inject(PRODUCT_WRITE_REPOSITORY)
    protected readonly repository: IProductWriteRepository,
  ) {
    super(amqpConnection);
  }

  /**
   * Executes the `CreateProductCommand`.
   *
   * @param command - The `CreateProductCommand` instance.
   */
  async execute(command: CreateProductCommand): Promise<any> {
    try {
      const { data, meta } = command;

      // Merge the product context with the event publisher
      const product = this.publisher.mergeObjectContext(
        await this.repository.findOneById(command.data.id),
      );

      // Create the product and commit the changes
      product.create(data, meta);
      product.commit();
    } catch (error) {
      this.logger.error(
        `Error executing CreateProductCommand: ${error.message}`,
        error.stack,
      );

      // Publish an event indicating that the product creation failed
      await this.publishEvent({
        event: {
          evt: 'events.corr_products.create_product_failed',
          data: command.data,
          meta: command.meta,
        },
        messages: [
          {
            level: 'error',
            service: domainInfo().service,
            domain: domainInfo().domain,
            context: 'CreateProduct',
            exception: error.name,
            message: error.message,
          },
        ],
      });
    }
  }
}
