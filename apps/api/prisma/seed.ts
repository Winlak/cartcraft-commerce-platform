import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  {
    name: "Настольная лампа Dome",
    slug: "dome-table-lamp",
    sku: "LMP-DOME-001",
    price: 8990,
    stock: 12,
    imageUrl: "/products/dome-lamp.png",
    category: "Свет",
    description:
      "Лампа с матовым керамическим основанием и тёплым рассеянным светом.",
  },
  {
    name: "Настольная лампа Aura",
    slug: "aura-desk-lamp",
    sku: "LMP-AURA-002",
    price: 6490,
    stock: 8,
    imageUrl: "/products/aura-lamp.png",
    category: "Свет",
    description:
      "Лаконичный светильник для рабочего стола с направленным светом.",
  },
  {
    name: "Подставка для ручек Line",
    slug: "line-pencil-holder",
    sku: "ACC-LINE-003",
    price: 1490,
    stock: 25,
    imageUrl: "/products/line-holder.png",
    category: "Для работы",
    description:
      "Рифлёная подставка из каменной керамики для письменных принадлежностей.",
  },
  {
    name: "Органайзер Tray",
    slug: "tray-organizer",
    sku: "ACC-TRAY-004",
    price: 1990,
    stock: 16,
    imageUrl: "/products/tray-organizer.png",
    category: "Хранение",
    description: "Низкий органайзер для мелочей, часов и ежедневных ритуалов.",
  },
  {
    name: "Бра Globe Brass",
    slug: "globe-brass-sconce",
    sku: "LMP-GLOBE-005",
    price: 3490,
    stock: 2,
    imageUrl: "/products/globe-sconce.png",
    category: "Свет",
    description:
      "Компактное настенное бра с молочным плафоном и латунной фурнитурой.",
  },
  {
    name: "Торшер Wood Tripod",
    slug: "wood-tripod-floor-lamp",
    sku: "LMP-WOOD-006",
    price: 9990,
    stock: 5,
    imageUrl: "/products/wood-tripod.png",
    category: "Свет",
    description: "Напольный светильник на устойчивом деревянном основании.",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("DemoPass123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@cartcraft.local" },
    update: {},
    create: {
      email: "admin@cartcraft.local",
      passwordHash,
      firstName: "Анна",
      lastName: "Администратор",
      role: Role.ADMIN,
    },
  });
  const demoUser = await prisma.user.upsert({
    where: { email: "user@cartcraft.local" },
    update: {},
    create: {
      email: "user@cartcraft.local",
      passwordHash,
      firstName: "Иван",
      lastName: "Петров",
    },
  });
  await prisma.address.upsert({
    where: { id: "demo-address" },
    update: {},
    create: {
      id: "demo-address",
      userId: demoUser.id,
      recipient: "Иван Петров",
      phone: "+7 999 123-45-67",
      city: "Москва",
      street: "ул. Тверская, 12, кв. 45",
      postalCode: "125009",
      isDefault: true,
    },
  });

  for (const item of products) {
    const { category: categoryName, ...productData } = item;
    const category = await prisma.category.upsert({
      where: { slug: slugify(categoryName) },
      update: {},
      create: { name: categoryName, slug: slugify(categoryName) },
    });
    await prisma.product.upsert({
      where: { sku: productData.sku },
      update: { ...productData, categoryId: category.id },
      create: { ...productData, categoryId: category.id },
    });
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-яё-]/gi, "");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
