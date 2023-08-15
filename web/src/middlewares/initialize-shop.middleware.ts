import { Injectable, NestMiddleware } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NextFunction, Response, Request } from "express";
import { Model } from "mongoose";
import { Shop } from "../schemas/shop.schema.js";
import { Webhook, Webhooks } from "../types.js";
import shopify from "../utils/shopify.js";

@Injectable()
export class initializeShop implements NestMiddleware {
  constructor(
    @InjectModel(Shop.name) private ShopModel: Model<Shop>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const session = res.locals.shopify.session;
    const shop = await this.ShopModel.findOne({ domain: session.shop });
    const webhooks: Webhooks = await shopify.api.rest.Webhook.all({
      session
    });
    console.log(webhooks.data)

    if (!shop) {
      await this.ShopModel.create({ domain: session.shop, session: session });
    }

    if (shop && shop.session.accessToken !== session.accessToken) {
      await shop.overwrite({ session: session });
    }

    const orderPaid = webhooks.data.find(webhook => webhook.topic.includes('orders/paid'));

    if (!orderPaid) {
      const orderPaidWebhook = new shopify.api.rest.Webhook({session});
      orderPaidWebhook.address = `${process.env.HOST}/webhooks/orders/paid`;
      orderPaidWebhook.topic = 'orders/paid';
      orderPaidWebhook.format = 'json';
      await orderPaidWebhook.save({
        update: true
      })
    }

    next();
  }
}