export interface AggregateReconstructor<T> {
  reconstruct(id: string): Promise<T>;
}
