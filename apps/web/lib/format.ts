export const formatMoney = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
export const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: "Ожидает оплаты",
  PAID: "Оплачен",
  PROCESSING: "Собирается",
  SHIPPED: "Передан в доставку",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};
