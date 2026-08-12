import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthenticatedUser, CurrentUser } from "../common/auth.decorator";
import { JwtAuthGuard } from "../auth/auth.guards";
import { AddCartItemDto, UpdateCartItemDto } from "./cart.dto";
import { CartService } from "./cart.service";

@ApiTags("cart")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}
  @Get() get(@CurrentUser() user: AuthenticatedUser) {
    return this.cart.get(user.id);
  }
  @Post("items") add(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cart.add(user.id, dto.productId, dto.quantity);
  }
  @Patch("items/:id") update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cart.update(user.id, id, dto.quantity);
  }
  @Delete("items/:id") remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.cart.remove(user.id, id);
  }
}
