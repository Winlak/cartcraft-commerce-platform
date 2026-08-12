import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { PaymentStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  async createIntent(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { payments: true },
    });
    if (!order) throw new NotFoundException("Заказ не найден");
    if (order.status !== "PENDING_PAYMENT")
      throw new BadRequestException("Заказ уже не ожидает оплату");
    const pending = order.payments.find(
      (payment) => payment.status === PaymentStatus.PENDING,
    );
    if (pending)
      return {
        provider: "cartcraft-mock",
        reference: pending.providerReference,
        amount: pending.amount,
        status: pending.status,
      };
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount: order.total,
        providerReference: `mock_${crypto.randomUUID()}`,
      },
    });
    return {
      provider: "cartcraft-mock",
      reference: payment.providerReference,
      amount: payment.amount,
      status: payment.status,
    };
  }

  async handleWebhook(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ) {
    if (!rawBody || !signature || !this.signatureMatches(rawBody, signature))
      throw new UnauthorizedException("Недействительная подпись webhook");
    const event = JSON.parse(rawBody.toString("utf8")) as {
      reference: string;
      event: "payment.succeeded" | "payment.failed";
    };
    const payment = await this.prisma.payment.findUnique({
      where: { providerReference: event.reference },
    });
    if (!payment) throw new NotFoundException("Платёж не найден");
    if (payment.status !== PaymentStatus.PENDING)
      return { accepted: true, duplicate: true };
    if (event.event === "payment.failed") {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      return { accepted: true, duplicate: false };
    }
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.SUCCEEDED },
    });
    await this.orders.transition(payment.orderId, "PAID");
    return { accepted: true, duplicate: false };
  }

  async simulateSuccessfulPayment(userId: string, orderId: string) {
    const intent = await this.createIntent(userId, orderId);
    const rawBody = Buffer.from(
      JSON.stringify({
        reference: intent.reference,
        event: "payment.succeeded",
      }),
      "utf8",
    );
    return this.handleWebhook(rawBody, this.sign(rawBody));
  }

  private signatureMatches(rawBody: Buffer, signature: string) {
    const expected = this.sign(rawBody);
    const left = Buffer.from(expected, "utf8");
    const right = Buffer.from(signature, "utf8");
    return left.length === right.length && timingSafeEqual(left, right);
  }

  private sign(rawBody: Buffer) {
    return createHmac("sha256", process.env.MOCK_PAYMENT_WEBHOOK_SECRET ?? "")
      .update(rawBody)
      .digest("hex");
  }
}
