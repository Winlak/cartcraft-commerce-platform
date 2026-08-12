import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CacheService } from "../database/cache.service";
import { PrismaService } from "../database/prisma.service";
import { ProductQueryDto } from "./catalog.dto";

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async list(query: ProductQueryDto) {
    const normalized = {
      ...query,
      q: query.q?.trim().toLowerCase(),
      category: query.category?.trim().toLowerCase(),
    };
    const key = `catalog:list:${JSON.stringify(normalized)}`;
    const cached = await this.cache.get<unknown>(key);
    if (cached) return cached;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(normalized.q
        ? {
            OR: [
              { name: { contains: normalized.q, mode: "insensitive" } },
              { description: { contains: normalized.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(normalized.category
        ? { category: { slug: normalized.category } }
        : {}),
      ...(normalized.minPrice !== undefined || normalized.maxPrice !== undefined
        ? { price: { gte: normalized.minPrice, lte: normalized.maxPrice } }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    const response = {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        pageCount: Math.ceil(total / query.limit),
      },
    };
    await this.cache.set(key, response, 60);
    return response;
  }

  async categories() {
    const key = "catalog:categories";
    const cached = await this.cache.get<unknown>(key);
    if (cached) return cached;
    const categories = await this.prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });
    await this.cache.set(key, categories, 300);
    return categories;
  }

  async bySlug(slug: string) {
    const key = `catalog:product:${slug}`;
    const cached = await this.cache.get<unknown>(key);
    if (cached) return cached;
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { category: true },
    });
    if (!product) throw new NotFoundException("Товар не найден");
    await this.cache.set(key, product, 60);
    return product;
  }

  async invalidate() {
    await Promise.all([
      this.cache.invalidate("catalog:list:"),
      this.cache.invalidate("catalog:product:"),
      this.cache.invalidate("catalog:categories"),
    ]);
  }
}
