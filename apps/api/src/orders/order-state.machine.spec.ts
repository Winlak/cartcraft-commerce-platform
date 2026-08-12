import { BadRequestException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { ensureOrderTransition, mayRestoreStock } from "./order-state.machine";

describe("order state machine", () => {
  it("allows the payment and fulfillment path", () => {
    expect(() =>
      ensureOrderTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID),
    ).not.toThrow();
    expect(() =>
      ensureOrderTransition(OrderStatus.PAID, OrderStatus.PROCESSING),
    ).not.toThrow();
    expect(() =>
      ensureOrderTransition(OrderStatus.PROCESSING, OrderStatus.SHIPPED),
    ).not.toThrow();
    expect(() =>
      ensureOrderTransition(OrderStatus.SHIPPED, OrderStatus.DELIVERED),
    ).not.toThrow();
  });
  it("rejects skipping an order state", () => {
    expect(() =>
      ensureOrderTransition(OrderStatus.PENDING_PAYMENT, OrderStatus.SHIPPED),
    ).toThrow(BadRequestException);
    expect(() =>
      ensureOrderTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED),
    ).toThrow(BadRequestException);
  });
  it("restores reserved stock only when cancellation is still safe", () => {
    expect(
      mayRestoreStock(OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED),
    ).toBe(true);
    expect(mayRestoreStock(OrderStatus.PAID, OrderStatus.CANCELLED)).toBe(true);
    expect(mayRestoreStock(OrderStatus.PROCESSING, OrderStatus.CANCELLED)).toBe(
      false,
    );
  });
});
