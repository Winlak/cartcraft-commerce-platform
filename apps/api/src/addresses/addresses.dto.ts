import {
  IsBoolean,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class AddressDto {
  @IsString() @MinLength(2) @MaxLength(120) recipient!: string;
  @IsPhoneNumber("RU") phone!: string;
  @IsString() @MinLength(2) @MaxLength(100) city!: string;
  @IsString() @MinLength(4) @MaxLength(160) street!: string;
  @IsString() @MinLength(5) @MaxLength(16) postalCode!: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
