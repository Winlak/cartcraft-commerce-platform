import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/auth.guards";
import { AuthenticatedUser, CurrentUser } from "../common/auth.decorator";
import { MockWebhookDto } from "./payments.dto";
import { PaymentsService } from "./payments.service";
@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post(":orderId/intent")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  intent(
    @CurrentUser() user: AuthenticatedUser,
    @Param("orderId") orderId: string,
  ) {
    return this.payments.createIntent(user.id, orderId);
  }
  @Post(":orderId/mock-pay")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  mockPay(
    @CurrentUser() user: AuthenticatedUser,
    @Param("orderId") orderId: string,
  ) {
    return this.payments.simulateSuccessfulPayment(user.id, orderId);
  }
  @Post("mock/webhook")
  webhook(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers("x-mock-signature") signature: string | undefined,
    @Body() body: MockWebhookDto,
  ) {
    void body;
    return this.payments.handleWebhook(request.rawBody, signature);
  }
}
