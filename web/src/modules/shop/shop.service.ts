import { HttpException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Shop } from "./shop.schema.js";

@Injectable()
export class ShopService {
  constructor(@InjectModel(Shop.name) private ShopModel: Model<Shop>) {}

  async getShop(domain: string) {
    const shop = await this.ShopModel.findOne({ shop: domain });
    if (!shop) {
      throw new HttpException("Shop not found", 404);
    }

    if (!shop.authorized) {
      throw new HttpException("Shop not authorized", 401);
    }

    return shop;
  }

  async authorizeShop(token: string, domain: string) {
    const shop = await this.ShopModel.findOne({ shop: domain ,accessToken: token });
    if (!shop) {
      throw new HttpException("Shop not found", 404);
    }
    await this.ShopModel.updateOne({ shop: domain }, { authorized: true });
    return shop; 
  }

  async addNewShop(shop: string, accessToken: string) {
    try {
      const newShop = new this.ShopModel({ shop, accessToken });
      return await newShop.save();
    } catch(err: any) {
      throw new HttpException(err, 500);
    }
  }
}