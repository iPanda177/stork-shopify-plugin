import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NextFunction, Response } from "express";
import { Model } from "mongoose";
import { Shop } from "../modules/shop/shop.schema.js";

Injectable()
export class getShopDataMiddleware {
  constructor(@InjectModel(Shop.name) private ShopModel: Model<Shop>) {}

  async use(res: Response, next: NextFunction) {
    const session = res.locals.shopify.session;

    const shop = await this.ShopModel.findOne({ shop: session.domain });

    if (shop && shop.session !== session) {
      await shop.overwrite({ session: session });
    }

    next();
  }
}