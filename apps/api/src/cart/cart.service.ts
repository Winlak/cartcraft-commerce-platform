import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: { product: { include: { category: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return {
      ...cart,
      total: cart.items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0,
      ),
    };
  }

  async add(userId: string, productId: string, quantity: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });
    if (!product) throw new NotFoundException("Товар не найден");
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > product.stock)
      throw new BadRequestException(
        "В корзине нельзя указать больше, чем доступно на складе",
      );
    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: nextQuantity },
      create: { cartId: cart.id, productId, quantity },
    });
    return this.get(userId);
  }

  async update(userId: string, itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      include: { product: true },
    });
    if (!item) throw new NotFoundException("Позиция корзины не найдена");
    if (quantity > item.product.stock)
      throw new BadRequestException("Недостаточно товара на складе");
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
    return this.get(userId);
  }

  async remove(userId: string, itemId: string) {
    const result = await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cart: { userId } },
    });
    if (!result.count)
      throw new NotFoundException("Позиция корзины не найдена");
    return this.get(userId);
  }
}
