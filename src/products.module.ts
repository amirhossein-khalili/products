import { Module, Provider } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ProductReadRepository } from './infrastructure/repositories/read-product.repository';
import { ProductsController } from './interfaces/products.controller';
import {
  PRODUCT_READ_REPOSITORY,
  PRODUCT_WRITE_REPOSITORY,
} from './domain/repositories/injection-tokens';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductSchema,
  ProductSchemaFactory,
} from './infrastructure/schemas/product.schema';
import * as EventHandlers from './application/event-handlers';
import * as CommandHandlers from './application/commands/handlers';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ProductWriteRepository } from './infrastructure/repositories/write-product.repository';
import { Product } from './domain/entities/product.aggregate-root';
import { productsTransformers } from './products.transformers';
import { RecoModule } from './reco/src/reco.module';

export function toComparableState(aggregate: Product) {
  return {
    _id: aggregate.id,
    name: aggregate.name,
    price: aggregate.price,
    stock: aggregate.stock,
    status: aggregate.status,
  };
}

const Repositories: Provider[] = [
  {
    provide: PRODUCT_WRITE_REPOSITORY,
    useClass: ProductWriteRepository,
  },
  {
    provide: PRODUCT_READ_REPOSITORY,
    useClass: ProductReadRepository,
  },
];

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ProductSchema.name,
        schema: ProductSchemaFactory,
      },
    ]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [{ name: 'EVENTS', type: 'topic' }],
        uri: configService.get<string>('RABBITMQ_URL'),
        connectionInitOptions: { wait: false },
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CqrsModule,
  ],
  providers: [
    ...Object.values(CommandHandlers),
    ...Object.values(EventHandlers),
    ...Repositories,
  ],
  controllers: [ProductsController],
})
export class ProductsModule {}
