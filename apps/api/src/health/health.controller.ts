import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CacheService } from "../database/cache.service";
import { PrismaService } from "../database/prisma.service";
@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}
  @Get()
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const redis = await this.cache.ping();
      return {
        status: "ok",
        database: "up",
        redis: redis ? "up" : "degraded",
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException("Database unavailable");
    }
  }
}
