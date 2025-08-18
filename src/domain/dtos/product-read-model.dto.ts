export interface ProductReadModelDto {
  id: string;

  name: string;

  price: {
    amount: number;
    currency: string;
  };

  stock: number;

  status: string;
}
