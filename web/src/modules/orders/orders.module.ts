import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductsSchema } from "../../schemas/product.schema.ts";
import { ReferenceSchema } from "../../schemas/reference.schema.ts";
import { OrdersController } from "./orders.controller.ts";
import { OrdersService } from "./orders.service.ts";

@Module({
  imports: [MongooseModule.forFeature([
    { name: "Product", schema: ProductsSchema }, 
    { name: "Reference", schema: ReferenceSchema }
  ])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}