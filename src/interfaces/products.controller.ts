import {
  Controller,
  Post,
  Body,
  Inject,
  Headers,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BaseController, IMetadata } from 'com.chargoon.cloud.svc.common';
import { CreateProductCommand } from '../application/commands/impls';
import { IProductReadRepository } from '../domain/repositories/read-product.irepository';
import { PRODUCT_READ_REPOSITORY } from '../domain/repositories/injection-tokens';
import { CreateProductDto } from 'src/domain/dtos/create-product.dto';

/**
 * Controller for handling all product-related HTTP requests.
 * Adheres to CQRS by separating write operations (commands) from read operations (queries).
 */
@ApiTags('products')
@Controller('products')
export class ProductsController extends BaseController {
  constructor(
    private readonly commandBus: CommandBus,
    // The read repository is injected directly for query operations,
    // as no specific query handlers were defined in the provided code.
    @Inject(PRODUCT_READ_REPOSITORY)
    private readonly productReadRepository: IProductReadRepository,
  ) {
    super();
  }

  /**
   * Endpoint to create a new product.
   * It accepts product data, wraps it in a CreateProductCommand, and sends it to the command bus.
   * Returns 202 Accepted to indicate the command is being processed asynchronously.
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto, description: 'Data for the new product' })
  @ApiResponse({
    status: 202,
    description:
      'The product creation request has been accepted for processing.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @Headers() headers: any,
    @Request() req: any,
  ): Promise<void> {
    const meta: IMetadata = await this.getMetadata(
      createProductDto,
      headers,
      req,
      {
        pagination: true,
      },
    );

    await this.commandBus.execute(
      new CreateProductCommand(createProductDto, meta),
    );
  }
}
