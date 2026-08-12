import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<
    string,
    { value: string; expiresAt: number }
  >();
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    this.redis.on("error", () => undefined);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis.status === "wait") await this.redis.connect();
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      const cached = this.memory.get(key);
      if (!cached || cached.expiresAt < Date.now()) return null;
      return JSON.parse(cached.value) as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60) {
    const serialized = JSON.stringify(value);
    this.memory.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    try {
      if (this.redis.status === "wait") await this.redis.connect();
      await this.redis.set(key, serialized, "EX", ttlSeconds);
    } catch {
      this.logger.debug(
        `Redis unavailable; catalog response stored in short-lived local cache: ${key}`,
      );
    }
  }

  async invalidate(prefix: string) {
    for (const key of this.memory.keys())
      if (key.startsWith(prefix)) this.memory.delete(key);
    try {
      if (this.redis.status === "wait") await this.redis.connect();
      let cursor = "0";
      do {
        const [next, keys] = await this.redis.scan(
          cursor,
          "MATCH",
          `${prefix}*`,
          "COUNT",
          100,
        );
        cursor = next;
        if (keys.length) await this.redis.del(...keys);
      } while (cursor !== "0");
    } catch {
      // The local cache is already invalidated. The next Redis connection will receive fresh values.
    }
  }

  async ping() {
    try {
      if (this.redis.status === "wait") await this.redis.connect();
      return (await this.redis.ping()) === "PONG";
    } catch {
      return false;
    }
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
