import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { Shop } from "../../types/types";
import { ShopService } from "./shop.service.js";

@Controller("api/shop")
export class ShopController {
  constructor(private ShopService: ShopService) {}

  @Get()
  async getShop(@Res() res: Response) {
    const { domain } = res.locals.shopify.session;
    return await this.ShopService.getShop(domain);
  }

  @Get("auth")
  async authorizeShop(@Query() query: { domain: string, token: string }) {
    const { domain, token } = query;
    return await this.ShopService.authorizeShop(token, domain);
  }

  @Post("add")
  async addNewShop(@Body() body: Shop) {
    const { shop, accessToken } = body;
    return await this.ShopService.addNewShop(shop, accessToken);
  }
}