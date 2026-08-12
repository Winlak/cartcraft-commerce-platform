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
import { JwtAuthGuard } from "../auth/auth.guards";
import { AuthenticatedUser, CurrentUser } from "../common/auth.decorator";
import { AddressDto } from "./addresses.dto";
import { AddressesService } from "./addresses.service";
@ApiTags("addresses")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("addresses")
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}
  @Get() list(@CurrentUser() user: AuthenticatedUser) {
    return this.addresses.list(user.id);
  }
  @Post() create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddressDto,
  ) {
    return this.addresses.create(user.id, dto);
  }
  @Patch(":id") update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: AddressDto,
  ) {
    return this.addresses.update(user.id, id, dto);
  }
  @Delete(":id") remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.addresses.remove(user.id, id);
  }
}
