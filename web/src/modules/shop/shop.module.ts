import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ShopController } from "./shop.controller.js";
import { Shop, ShopSchema } from "./shop.schema.js";
import { ShopService } from "./shop.service.js";

@Module({
  imports: [MongooseModule.forFeature([{ name: Shop.name, schema: ShopSchema }])],
  controllers: [ShopController],
  providers: [ShopService],
  exports: [MongooseModule.forFeature([{ name: Shop.name, schema: ShopSchema }])]
})
export class ShopModule {}