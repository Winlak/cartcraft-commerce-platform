import { Cart, Product, Category, Address, Order, Session } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const error = (await response
      .json()
      .catch(() => ({ message: "Не удалось выполнить запрос" }))) as {
      message?: string | string[];
    };
    throw new ApiError(
      Array.isArray(error.message)
        ? error.message.join(", ")
        : (error.message ?? "Не удалось выполнить запрос"),
      response.status,
    );
  }
  return response.json() as Promise<T>;
}

export const api = {
  products: (search = "") =>
    request<{ items: Product[]; meta: { total: number } }>(
      `/catalog/products${search ? `?${search}` : ""}`,
    ),
  product: (slug: string) => request<Product>(`/catalog/products/${slug}`),
  categories: () => request<Category[]>("/catalog/categories"),
  login: (email: string, password: string) =>
    request<Session>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) =>
    request<Session>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  cart: (token: string) => request<Cart>("/cart", {}, token),
  addToCart: (token: string, productId: string, quantity = 1) =>
    request<Cart>(
      "/cart/items",
      { method: "POST", body: JSON.stringify({ productId, quantity }) },
      token,
    ),
  updateCart: (token: string, id: string, quantity: number) =>
    request<Cart>(
      `/cart/items/${id}`,
      { method: "PATCH", body: JSON.stringify({ quantity }) },
      token,
    ),
  removeCart: (token: string, id: string) =>
    request<Cart>(`/cart/items/${id}`, { method: "DELETE" }, token),
  addresses: (token: string) => request<Address[]>("/addresses", {}, token),
  createAddress: (token: string, data: Omit<Address, "id">) =>
    request<Address>(
      "/addresses",
      { method: "POST", body: JSON.stringify(data) },
      token,
    ),
  orders: (token: string) => request<Order[]>("/orders", {}, token),
  checkout: (token: string, addressId: string, idempotencyKey: string) =>
    request<Order>(
      "/orders/checkout",
      { method: "POST", body: JSON.stringify({ addressId, idempotencyKey }) },
      token,
    ),
  intent: (token: string, orderId: string) =>
    request<{ reference: string; amount: number }>(
      `/payments/${orderId}/intent`,
      { method: "POST" },
      token,
    ),
  mockPay: (token: string, orderId: string) =>
    request<{ accepted: boolean }>(
      `/payments/${orderId}/mock-pay`,
      { method: "POST" },
      token,
    ),
  adminProducts: (token: string) =>
    request<Product[]>("/admin/products", {}, token),
  adminOrders: (token: string) =>
    request<
      (Order & {
        user: { email: string; firstName: string; lastName: string };
      })[]
    >("/admin/orders", {}, token),
  setStock: (token: string, id: string, stock: number) =>
    request<Product>(
      `/admin/products/${id}/stock`,
      { method: "PATCH", body: JSON.stringify({ stock }) },
      token,
    ),
  setOrderStatus: (token: string, id: string, status: string) =>
    request<Order>(
      `/admin/orders/${id}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      token,
    ),
};
export { ApiError };
