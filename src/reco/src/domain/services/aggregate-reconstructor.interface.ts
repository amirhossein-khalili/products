/**
 * An interface for an aggregate reconstructor.
 * An aggregate reconstructor is used to reconstruct an aggregate from its event stream.
 */
export interface AggregateReconstructor<T> {
  /**
   * Reconstructs an aggregate from its event stream.
   * @param id The ID of the aggregate to reconstruct.
   * @returns The reconstructed aggregate.
   */
  reconstruct(id: string): Promise<T>;
}
