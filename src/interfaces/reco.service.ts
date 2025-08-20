import { Inject, Injectable } from '@nestjs/common';
import { AggregateReconstructor } from './reco/services/aggregate-reconstructor.service';
import { Product } from 'src/domain/entities/product.aggregate-root';
import { ProductRecoRepository } from './reco/repo/products/product-reco.repository';
import { StateComparator } from './reco/services/state-comparator.service';

export function toComparableState(aggregate: Product) {
  return {
    _id: aggregate.id,
    name: aggregate.name,
    price: aggregate.price,
    stock: aggregate.stock,
    status: aggregate.status,
  };
}

@Injectable()
export class RecoService {
  constructor(
    @Inject() private readonly aggregateReconstructor: AggregateReconstructor,
    @Inject() private readonly readRepository: ProductRecoRepository,

    private readonly stateComparator: StateComparator,
  ) {}

  public async checkSingleId(id) {
    const aggregate = await this.aggregateReconstructor.reconstruct(id);

    const expectedState = toComparableState(aggregate);

    const actualState = await this.readRepository.findById(id);

    const result = this.stateComparator.compare(expectedState, actualState);
    // const comparison = this.comparator.compare(expectedState, actualState);

    return { expectedState, actualState, result };
  }
}
