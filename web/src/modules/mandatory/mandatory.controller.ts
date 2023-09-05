import { Body, Controller, Headers, Post, Res } from "@nestjs/common";
import { Response } from "express";

import { MandatoryService } from "./mandatory.service.ts";

import crypto from "crypto";

@Controller()
export class MandatoryController {
  constructor(
    private mandatoryService: MandatoryService,
  ) {}

  @Post('/api/webhooks')
  async handleAppUninstalled(@Body() body: any, @Res() res: Response) {
    console.log(body)
    res.sendStatus(200);
  }

  @Post('/api/mandatory/customers/data_request')
  async viewStoredData(@Headers() headers: any, @Body() body: any, @Res() res: Response) {
    console.log('webhook works')
    res.sendStatus(200);
    const hmac = headers['x-shopify-hmac-sha256'];

    const genHash = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET?.toString() || '')
      .update(Buffer.from(JSON.stringify(body)))
      .digest('base64');

    if (genHash !== hmac) {
      throw new Error('Unauthorized mandatory webhook request');
    }
  }

  @Post('/api/mandatory/customers/redact')
  async eraseStoredData(@Headers() headers: any, @Body() body: any, @Res() res: Response) {
    console.log('webhook works')
    res.sendStatus(200);

    const hmac = headers['x-shopify-hmac-sha256'];

    const genHash = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET?.toString() || '')
      .update(Buffer.from(JSON.stringify(body)))
      .digest('base64');

    if (genHash !== hmac) {
      throw new Error('Unauthorized mandatory webhook request');
    }
  }

  @Post('/api/mandatory/shop/redact')
  async eraseShopData(@Headers() headers: any, @Body() body: any, @Res() res: Response) {
    console.log('webhook works')
    res.sendStatus(200);

    const hmac = headers['x-shopify-hmac-sha256'];

    const genHash = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET?.toString() || '')
      .update(Buffer.from(JSON.stringify(body)))
      .digest('base64');

    if (genHash !== hmac) {
      throw new Error('Unauthorized mandatory webhook request');
    }

    const { shop_domain } = body;

    await this.mandatoryService.eraseShopData(shop_domain);
  }
}