import { IsString, MaxLength } from "class-validator";
export class CheckoutDto {
  @IsString() @MaxLength(80) addressId!: string;
  @IsString() @MaxLength(120) idempotencyKey!: string;
}
