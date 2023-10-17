import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { ShopDocument } from "../../schemas/shop.schema.ts";
import { ShopService } from "./shop.service.ts";

@Controller("api/shop")
export class ShopController {
  constructor(private shopService: ShopService) {}

  @Get()
  async getShop(@Res() res: Response) {
    const { shop } = res.locals.shopify.session;
    const shopData = await this.shopService.getShop(shop);

    shopData ? res.status(200).send(shopData) : res.status(404).send('Shop not found');
  }

  @Get("auth")
  async authorizeShop(@Res() res: Response, @Query() query: { token: string }) {
    const { token } = query;
    const isValidToken =  await this.shopService.authorizeShop(token);

    isValidToken ? res.status(200).send('Authorized') : res.status(401).send('Unauthorized');

    if (isValidToken) {
      const session = res.locals.shopify.session;
      const syncShop = await this.shopService.syncShop(session, token);
    }
  }
}