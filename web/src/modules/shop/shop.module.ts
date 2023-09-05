import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ShopController } from "./shop.controller.ts";
import { Shop, ShopSchema } from "../../schemas/shop.schema.ts";
import { ShopService } from "./shop.service.ts";
import { ProductsService } from "../products/products.service.ts";
import { ProductsModule } from "../products/products.module.ts";
import { Product, ProductsSchema } from "../../schemas/product.schema.ts";
import { Reference, ReferenceSchema } from "../../schemas/reference.schema.ts";

@Module({
  imports: [MongooseModule.forFeature([
      { name: Shop.name, schema: ShopSchema }, 
      { name: Product.name, schema: ProductsSchema }, 
      { name: Reference.name, schema: ReferenceSchema }
    ]), 
    ProductsModule
  ],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [MongooseModule.forFeature([{ name: Shop.name, schema: ShopSchema }])]
})
export class ShopModule {}