import { BadRequestException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [OrderStatus.PAID, OrderStatus.CANCELLED],
  PAID: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

export function ensureOrderTransition(from: OrderStatus, to: OrderStatus) {
  if (!transitions[from].includes(to))
    throw new BadRequestException(`Нельзя изменить статус ${from} на ${to}`);
}

export function mayRestoreStock(from: OrderStatus, to: OrderStatus) {
  const cancellable: OrderStatus[] = [
    OrderStatus.PENDING_PAYMENT,
    OrderStatus.PAID,
  ];
  return to === OrderStatus.CANCELLED && cancellable.includes(from);
}
