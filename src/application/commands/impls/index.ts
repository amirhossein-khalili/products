import { CreateProductDto } from 'src/domain/dtos';
import { BaseCommand } from './base-command';

export class CreateProductCommand extends BaseCommand<CreateProductDto> {}
