import { HttpException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Shop } from "../../schemas/shop.schema.js";

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
    
  }
}