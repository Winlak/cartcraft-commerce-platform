export type Role = "USER" | "ADMIN";
export interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: number;
  stock: number;
  imageUrl: string;
  isActive: boolean;
  category: Category;
}
export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}
export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
}
export interface Address {
  id: string;
  recipient: string;
  phone: string;
  city: string;
  street: string;
  postalCode: string;
  isDefault: boolean;
}
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
}
export interface Order {
  id: string;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  address?: Address;
}
export interface Session {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
}
