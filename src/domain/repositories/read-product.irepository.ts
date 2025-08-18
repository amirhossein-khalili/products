import { ProductReadModelDto } from '../dtos/product-read-model.dto';
import { PaginationParamsDto } from '../dtos';
export interface IProductReadRepository {
  findById(id: string): Promise<Omit<ProductReadModelDto, 'status'> | null>;
  findAll(
    params: PaginationParamsDto,
  ): Promise<Omit<ProductReadModelDto, 'status'>[]>;
  findByName(name: string): Promise<Omit<ProductReadModelDto, 'status'> | null>;
  search(name: string): Promise<Omit<ProductReadModelDto, 'status'>[]>;
  countAll(): Promise<number>;
  save(product: Partial<ProductReadModelDto>): Promise<void>;
  getAllIds(): Promise<string[]>;
}
