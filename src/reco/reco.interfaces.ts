
export interface IAggregateReconstructor<A> {
  reconstruct(id: string): Promise<A>;
}

