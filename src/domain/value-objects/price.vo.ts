export class PriceVO {
  private constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {
    if (amount < 0) {
      throw new Error('price can be lower than 0 ');
    }
  }

  public static create(amount: number, currency: string) {
    return new PriceVO(amount, currency);
  }
}
