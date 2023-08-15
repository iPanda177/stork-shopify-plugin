import { HttpException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Shop } from "../../schemas/shop.schema.js";

import { config } from "dotenv";
import { ProductsService } from "../products/products.service.js";
import { Product } from "../../schemas/product.schema.js";
import { shopifySession } from "../../types.js";
import shopify from "../../utils/shopify.js";
import { Reference } from "../../schemas/reference.schema.js";
config();

@Injectable()
export class ShopService {
  constructor(
    @InjectModel(Shop.name) private ShopModel: Model<Shop>,
    @InjectModel(Product.name) private ProductModel: Model<Product>, 
    @InjectModel(Reference.name) private ReferenceModel: Model<Reference>,
    private productService: ProductsService
  ) {}

  async getShop(domain: string) {
    const shop = await this.ShopModel.findOne({ domain: domain });

    if (!shop) {
      throw new HttpException("Shop not found", 404);
    }

    return shop;
  }

  async authorizeShop(token: string) {
    const checkValidateToken = await fetch(`${process.env.STORK_API_URL}/auth/validate-token`, {
      method: "GET",
      headers: {Authorization: `Bearer ${process.env.STORK_API_KEY}`}
    })

    return checkValidateToken.ok;
  }

  async syncShop(session: shopifySession) {
    await this.ShopModel.updateOne({ domain: session.shop }, { authorized: true });

    const productsInDB = await this.ProductModel.find({});

    const requestsPerSecond = 2;
    const interval = 1000 / requestsPerSecond; 

    for (const product of productsInDB) {
      const newProduct = new shopify.api.rest.Product({ session: session });
      newProduct.title = product.title;
      newProduct.body_html = product.description;
      newProduct.images = product.images.map((image) => ({ src: image }));
      newProduct.variants = [{ price: product.price, inventory_quantity: product.quantity, sku: product.sku }];
      newProduct.product_type = product.properties.type;
      newProduct.published = false;
      await newProduct.save({
        update: true,
      });

      const referenceProduct = await this.ReferenceModel.findOne({ stork_id: product.id });
      if (referenceProduct) {
        referenceProduct.shopify_products_ids[session.shop] = newProduct.id;
        await referenceProduct.save();
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    };
  }
}