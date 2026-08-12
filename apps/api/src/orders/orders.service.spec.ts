import { ConflictException } from "@nestjs/common";
import { OrdersService } from "./orders.service";

describe("OrdersService checkout", () => {
  const product = {
    id: "product-1",
    name: "Лампа",
    price: 1990,
    imageUrl: "/lamp.png",
  };
  it("rejects checkout when atomic stock reservation cannot be acquired", async () => {
    const transaction = {
      order: { findUnique: jest.fn().mockResolvedValue(null) },
      address: { findFirst: jest.fn().mockResolvedValue({ id: "address-1" }) },
      cart: {
        findUnique: jest
          .fn()
          .mockResolvedValue({
            id: "cart-1",
            items: [{ productId: product.id, quantity: 2, product }],
          }),
      },
      product: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      cartItem: { deleteMany: jest.fn() },
    };
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(
        async (handler: (tx: typeof transaction) => Promise<unknown>) =>
          handler(transaction),
      ),
    };
    const service = new OrdersService(prisma as never);
    await expect(
      service.checkout("user-1", "address-1", "idem-1"),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.product.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ stock: { gte: 2 } }),
      }),
    );
  });
});
