import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { ShopDocument } from "../../schemas/shop.schema.js";
import { ShopService } from "./shop.service.js";

@Controller("api/shop")
export class ShopController {
  constructor(private ShopService: ShopService) {}

  @Get()
  async getShop(@Res() res: Response) {
    console.log('get request')
    const { domain } = res.locals.shopify.session;
    return await this.ShopService.getShop(domain);
  }

  @Get("auth")
  async authorizeShop(@Query() query: { domain: string, token: string }) {
    const { domain, token } = query;
    return await this.ShopService.authorizeShop(token, domain);
  }
}