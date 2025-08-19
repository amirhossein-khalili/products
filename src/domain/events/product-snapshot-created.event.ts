import {
  IEvent,
  IMetadata,
} from 'com.chargoon.cloud.svc.common/dist/interfaces';
import { Snapshot } from 'com.chargoon.cloud.svc.common/dist/types';

export class ProductSnapshotCreated implements IEvent<Snapshot> {
  readonly eventCategory: string = 'product_snapshots';

  readonly eventType: string;

  constructor(
    public readonly data: Snapshot,
    public readonly meta: IMetadata,
  ) {
    this.eventType = Object.getPrototypeOf(this).constructor.name;
  }
}
