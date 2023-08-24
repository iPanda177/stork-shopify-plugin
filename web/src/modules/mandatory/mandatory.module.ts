import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ShopSchema } from "../../schemas/shop.schema.js";
import { MandatoryController } from "./mandatory.controller.js";
import { MandatoryService } from "./mandatory.service.js";

@Module({
  controllers: [MandatoryController],
  providers: [MandatoryService],
  imports: [MongooseModule.forFeature([{ name: "Shop", schema: ShopSchema }])],
})
export class MandatoryModule {}