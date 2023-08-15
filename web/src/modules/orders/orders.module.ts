import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [MongooseModule.forFeature([])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}