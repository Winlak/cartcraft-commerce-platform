import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard, RolesGuard } from "../auth/auth.guards";
import { Roles } from "../common/auth.decorator";
import { ProductDto, StockDto, UpdateOrderStatusDto } from "./admin.dto";
import { AdminService } from "./admin.service";
@ApiTags("admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get("products") products() {
    return this.admin.products();
  }
  @Post("products") createProduct(@Body() dto: ProductDto) {
    return this.admin.createProduct(dto);
  }
  @Patch("products/:id") updateProduct(
    @Param("id") id: string,
    @Body() dto: Partial<ProductDto>,
  ) {
    return this.admin.updateProduct(id, dto);
  }
  @Patch("products/:id/stock") setStock(
    @Param("id") id: string,
    @Body() dto: StockDto,
  ) {
    return this.admin.setStock(id, dto.stock);
  }
  @Get("orders") orders() {
    return this.admin.ordersList();
  }
  @Patch("orders/:id/status") updateOrder(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.admin.updateOrderStatus(id, dto.status);
  }
}
