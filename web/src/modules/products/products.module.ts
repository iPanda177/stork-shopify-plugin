import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductsSchema } from "./product.schema.js";
import { ProductsController } from "./products.controller.js";
import { ProductsService } from "./products.service.js";

@Module({
  imports: [MongooseModule.forFeature([{ name: "Product", schema: ProductsSchema }])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}