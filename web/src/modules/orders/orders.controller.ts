import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { Response, Request } from "express";
import { OrdersService } from "./orders.service.ts";

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

  @Post('fullfilled')
  async handleOrderFulfilled(@Body() body: any, @Res() res: Response) {
    const { external_order_id, tracking_info, products, shop_domain } = body;

    const orderData = await this.ordersService.handleOrderFulfilled(external_order_id, tracking_info, products, shop_domain);

    orderData ? res.sendStatus(200) : res.sendStatus(400);
  }
}