import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ShopController } from "./shop.controller.js";
import { Shop, ShopSchema } from "../../schemas/shop.schema.js";
import { ShopService } from "./shop.service.js";
import { ProductsService } from "../products/products.service.js";
import { ProductsModule } from "../products/products.module.js";
import { Product, ProductsSchema } from "../../schemas/product.schema.js";
import { Reference, ReferenceSchema } from "../../schemas/reference.schema.js";

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