import { Injectable, NestMiddleware } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NextFunction, Response, Request } from "express";
import { Model } from "mongoose";
import { Shop } from "../schemas/shop.schema.js";

@Injectable()
export class getShopDataMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(Shop.name) private ShopModel: Model<Shop>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const session = res.locals.shopify.session;

    const shop = await this.ShopModel.findOne({ domain: session.shop });

    if (!shop) {
      await this.ShopModel.create({ domain: session.shop, session: session });
    }

    if (shop && shop.session.accessToken !== session.accessToken) {
      await shop.overwrite({ session: session });
    }

    next();
  }
}