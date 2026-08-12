import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { OrderStatus } from "@prisma/client";

export class ProductDto {
  @IsString() @MaxLength(140) name!: string;
  @IsString() @MaxLength(140) slug!: string;
  @IsString() @MaxLength(3000) description!: string;
  @IsString() @MaxLength(80) sku!: string;
  @Type(() => Number) @IsInt() @Min(0) price!: number;
  @Type(() => Number) @IsInt() @Min(0) stock!: number;
  @IsString() @MaxLength(400) imageUrl!: string;
  @IsString() @MaxLength(80) categoryId!: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class StockDto {
  @Type(() => Number) @IsInt() @Min(0) stock!: number;
}
export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus) status!: OrderStatus;
}
