import {
  IEvent,
  IMetadata,
} from 'com.chargoon.cloud.svc.common/dist/interfaces';

export class BaseEvent<T> implements IEvent<T> {
  readonly eventCategory: string = 'corr_products';

  readonly eventType: string;

  constructor(
    public readonly data: T,
    public readonly meta: IMetadata,
  ) {
    this.eventType = Object.getPrototypeOf(this).constructor.name;
  }
}
