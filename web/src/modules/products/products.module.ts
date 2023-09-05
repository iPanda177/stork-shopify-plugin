import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ShopSchema } from "../../schemas/shop.schema.ts";
import { ProductsSchema } from "../../schemas/product.schema.ts";
import { ProductsController } from "./products.controller.ts";
import { ProductsService } from "./products.service.ts";
import { ReferenceSchema } from "../../schemas/reference.schema.ts";

@Module({
  imports: [MongooseModule.forFeature([
    { name: "Product", schema: ProductsSchema }, 
    { name: "Shop", schema: ShopSchema }, 
    { name: "Reference", schema: ReferenceSchema }
  ])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})
export class ProductsModule {}