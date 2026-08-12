import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.guards";
import { AuthenticatedUser, CurrentUser } from "../common/auth.decorator";
import { CheckoutDto } from "./orders.dto";
import { OrdersService } from "./orders.service";
@ApiTags("orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Get() list(@CurrentUser() user: AuthenticatedUser) {
    return this.orders.list(user.id);
  }
  @Get(":id") get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.orders.getForUser(user.id, id);
  }
  @Post("checkout") checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CheckoutDto,
  ) {
    return this.orders.checkout(user.id, dto.addressId, dto.idempotencyKey);
  }
}
