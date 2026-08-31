export interface Product {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  barcode: string | null;
  description: string | null;
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrates_g: number;
  fiber_g: number;
  created_at: string;
  updated_at: string;
}

export interface ProductPayload {
  name: string;
  brand: string | null;
  category: string | null;
  barcode: string | null;
  description: string | null;
  calories_kcal: number;
  protein_g: number;
  fat_g: number;
  carbohydrates_g: number;
  fiber_g: number;
}
