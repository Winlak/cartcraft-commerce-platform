import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";
import { AdminModule } from "./admin/admin.module";
import { AddressesModule } from "./addresses/addresses.module";
import { AuthModule } from "./auth/auth.module";
import { CartModule } from "./cart/cart.module";
import { CatalogModule } from "./catalog/catalog.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(16).required(),
        JWT_EXPIRES_IN: Joi.string().default("2h"),
        MOCK_PAYMENT_WEBHOOK_SECRET: Joi.string().min(8).required(),
        REDIS_URL: Joi.string().uri().required(),
        API_PORT: Joi.number().port().default(4000),
      }),
    }),
    DatabaseModule,
    AuthModule,
    CatalogModule,
    CartModule,
    AddressesModule,
    OrdersModule,
    PaymentsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
