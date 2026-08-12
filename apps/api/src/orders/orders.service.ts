import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { ensureOrderTransition, mayRestoreStock } from "./order-state.machine";

const ORDER_INCLUDE = { items: true, address: true, payments: true } as const;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkout(userId: string, addressId: string, idempotencyKey: string) {
    const existing = await this.prisma.order.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: ORDER_INCLUDE,
    });
    if (existing) return existing;
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const replay = await tx.order.findUnique({
            where: { userId_idempotencyKey: { userId, idempotencyKey } },
            include: ORDER_INCLUDE,
          });
          if (replay) return replay;
          const [address, cart] = await Promise.all([
            tx.address.findFirst({ where: { id: addressId, userId } }),
            tx.cart.findUnique({
              where: { userId },
              include: { items: { include: { product: true } } },
            }),
          ]);
          if (!address) throw new NotFoundException("Адрес не найден");
          if (!cart?.items.length)
            throw new BadRequestException("Корзина пуста");
          const items = [...cart.items].sort((left, right) =>
            left.productId.localeCompare(right.productId),
          );
          for (const item of items) {
            const reservation = await tx.product.updateMany({
              where: {
                id: item.productId,
                isActive: true,
                stock: { gte: item.quantity },
              },
              data: { stock: { decrement: item.quantity } },
            });
            if (reservation.count !== 1)
              throw new ConflictException(
                `Недостаточно остатка: ${item.product.name}`,
              );
          }
          const total = items.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0,
          );
          const order = await tx.order.create({
            data: {
              number: this.orderNumber(),
              userId,
              addressId,
              total,
              idempotencyKey,
              items: {
                create: items.map((item) => ({
                  productId: item.productId,
                  productName: item.product.name,
                  imageUrl: item.product.imageUrl,
                  unitPrice: item.product.price,
                  quantity: item.quantity,
                })),
              },
            },
            include: ORDER_INCLUDE,
          });
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
          return order;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (this.isUniqueIdempotencyError(error)) {
        return this.prisma.order.findUniqueOrThrow({
          where: { userId_idempotencyKey: { userId, idempotencyKey } },
          include: ORDER_INCLUDE,
        });
      }
      throw error;
    }
  }

  list(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  async getForUser(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException("Заказ не найден");
    return order;
  }

  async transition(orderId: string, nextStatus: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new NotFoundException("Заказ не найден");
      ensureOrderTransition(order.status, nextStatus);
      if (mayRestoreStock(order.status, nextStatus)) {
        for (const item of order.items)
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
        include: ORDER_INCLUDE,
      });
    });
  }

  private orderNumber() {
    return `CC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  }
  private isUniqueIdempotencyError(error: unknown): error is { code: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    );
  }
}
