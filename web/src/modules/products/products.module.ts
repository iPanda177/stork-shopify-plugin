import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ShopSchema } from "../../schemas/shop.schema.js";
import { ProductsSchema } from "../../schemas/product.schema.js";
import { ProductsController } from "./products.controller.js";
import { ProductsService } from "./products.service.js";
import { ReferenceSchema } from "../../schemas/reference.schema.js";

@Module({
  imports: [MongooseModule.forFeature([
    { name: "Product", schema: ProductsSchema }, 
    { name: "Shop", schema: ShopSchema }, 
    { name: "Reference", schema: ReferenceSchema }
  ])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}