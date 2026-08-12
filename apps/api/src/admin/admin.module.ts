import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
@Module({
  imports: [CatalogModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
