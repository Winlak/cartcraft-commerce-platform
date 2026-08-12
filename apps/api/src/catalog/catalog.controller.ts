import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ProductQueryDto } from "./catalog.dto";
import { CatalogService } from "./catalog.service";

@ApiTags("catalog")
@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get("products") list(@Query() query: ProductQueryDto) {
    return this.catalog.list(query);
  }
  @Get("categories") categories() {
    return this.catalog.categories();
  }
  @Get("products/:slug") bySlug(@Param("slug") slug: string) {
    return this.catalog.bySlug(slug);
  }
}
