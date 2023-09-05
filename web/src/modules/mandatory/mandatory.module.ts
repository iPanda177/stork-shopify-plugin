import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ShopSchema } from "../../schemas/shop.schema.ts";
import { MandatoryController } from "./mandatory.controller.ts";
import { MandatoryService } from "./mandatory.service.ts";

@Module({
  controllers: [MandatoryController],
  providers: [MandatoryService],
  imports: [MongooseModule.forFeature([{ name: "Shop", schema: ShopSchema }])],
})
export class MandatoryModule {}