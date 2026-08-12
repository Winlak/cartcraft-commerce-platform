import { Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { CatalogService } from "../catalog/catalog.service";
import { PrismaService } from "../database/prisma.service";
import { OrdersService } from "../orders/orders.service";
import { ProductDto } from "./admin.dto";
@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly orders: OrdersService,
  ) {}
  products() {
    return this.prisma.product.findMany({
      include: { category: true },
      orderBy: { updatedAt: "desc" },
    });
  }
  async createProduct(dto: ProductDto) {
    const product = await this.prisma.product.create({
      data: { ...dto, isActive: dto.isActive ?? true },
      include: { category: true },
    });
    await this.catalog.invalidate();
    return product;
  }
  async updateProduct(id: string, dto: Partial<ProductDto>) {
    const result = await this.prisma.product.updateMany({
      where: { id },
      data: dto,
    });
    if (!result.count) throw new NotFoundException("Товар не найден");
    await this.catalog.invalidate();
    return this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: { category: true },
    });
  }
  async setStock(id: string, stock: number) {
    return this.updateProduct(id, { stock });
  }
  ordersList() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
  updateOrderStatus(orderId: string, status: OrderStatus) {
    return this.orders.transition(orderId, status);
  }
}
