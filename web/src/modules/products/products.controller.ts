import { Body, Controller, Get, Query, Res } from "@nestjs/common";
import { Response } from "express";
import { ProductsService } from "./products.service.js";
import { ProductVariant } from "../../types.js";

@Controller('api/product')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('check-qty')
  async checkProductQty(@Query() query: { shop: string }, @Body() body: ProductVariant[], @Res() res: Response) {
    const { shop } = query;
    const isAvailable = await this.productsService.checkProductQty(body, shop);
    isAvailable ? res.sendStatus(200) : res.sendStatus(400);
  }
}