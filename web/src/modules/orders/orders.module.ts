import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductsSchema } from "../../schemas/product.schema.js";
import { ReferenceSchema } from "../../schemas/reference.schema.js";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";

@Module({
  imports: [MongooseModule.forFeature([
    { name: "Product", schema: ProductsSchema }, 
    { name: "Reference", schema: ReferenceSchema }
  ])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}