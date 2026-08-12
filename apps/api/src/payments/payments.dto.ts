import { IsIn, IsString, MaxLength } from "class-validator";
export class MockWebhookDto {
  @IsString() @MaxLength(100) reference!: string;
  @IsIn(["payment.succeeded", "payment.failed"]) event!:
    "payment.succeeded" | "payment.failed";
}
