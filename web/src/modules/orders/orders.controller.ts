import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { Response, Request } from "express";
import { OrdersService } from "./orders.service.js";

@Controller('api/orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async handleOrderPaid(@Req() req: Request, @Body() body: any, @Res() res: Response) {
    res.sendStatus(200);
    const shopDomain = req.get('x-shopify-shop-domain');
    if (!shopDomain) {
      throw new Error('Missing shop domain');
    }

    const orderData = await this.ordersService.handleOrderPaid(body, shopDomain);
  }
}