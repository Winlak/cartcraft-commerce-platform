import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@cartcraft.local" })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: "DemoPass123!" })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, {
    message: "Пароль должен содержать строчную, заглавную букву и цифру",
  })
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  lastName!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
