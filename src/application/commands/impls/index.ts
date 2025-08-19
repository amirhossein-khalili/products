import { CreateProductDto } from 'src/domain/dtos/create-product.dto';
import { BaseCommand } from './base-command';
import { FinilizeCreateProductDto } from 'src/domain/dtos/finilize-create-product.dto';

export class CreateProductCommand extends BaseCommand<CreateProductDto> {}
export class FinilizeCreateProductCommand extends BaseCommand<FinilizeCreateProductDto> {}
