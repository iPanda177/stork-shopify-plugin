import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { OrdersService } from "./orders.service";

@Controller("/webhooks")
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post("orders/paid")
  async handleOrderPaid(@Body() body: any, @Res() res: Response) {
    console.log(body)

    res.sendStatus(200);

  
    const orderData = await this.ordersService.handleOrderPaid(body);
  }
}