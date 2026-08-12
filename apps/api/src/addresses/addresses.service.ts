import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { AddressDto } from "./addresses.dto";

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }
  async create(userId: string, dto: AddressDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault)
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      const count = await tx.address.count({ where: { userId } });
      return tx.address.create({
        data: { ...dto, isDefault: dto.isDefault ?? count === 0, userId },
      });
    });
  }
  async update(userId: string, id: string, dto: AddressDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault)
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      return tx.address.updateMany({ where: { id, userId }, data: dto });
    });
    if (!result.count) throw new NotFoundException("Адрес не найден");
    return this.prisma.address.findUniqueOrThrow({ where: { id } });
  }
  async remove(userId: string, id: string) {
    const result = await this.prisma.address.deleteMany({
      where: { id, userId },
    });
    if (!result.count) throw new NotFoundException("Адрес не найден");
  }
}
