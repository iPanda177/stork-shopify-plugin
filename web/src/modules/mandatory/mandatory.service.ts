import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Shop } from "../../schemas/shop.schema.js";

@Injectable()
export class MandatoryService {
  constructor(@InjectModel(Shop.name) private ShopModel: Model<Shop>) {}

  async eraseShopData(shop_domain: string) {
    await this.ShopModel.findOneAndDelete({ domain: shop_domain });
  }
}
