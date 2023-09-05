import { HttpException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Shop } from "../../schemas/shop.schema.ts";

import { config } from "dotenv";
import { ProductsService } from "../products/products.service.ts";
import { Product } from "../../schemas/product.schema.ts";
import { shopifySession } from "../../types.ts";
import shopify from "../../utils/shopify.ts";
import { Reference } from "../../schemas/reference.schema.ts";
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
    const checkValidateToken = await fetch(`${process.env.STORK_API_URL_DEV}/auth/validate-token`, {
      method: "GET",
      headers: {Authorization: `Bearer ${token}`}
    })

    return checkValidateToken.ok;
  }

  async syncShop(session: shopifySession) {
    try {
      await this.ShopModel.updateOne({ domain: session.shop }, { authorized: true });

      const productsInDB = await this.ProductModel.find({});

      const requestsPerSecond = 2;
      const interval = 1000 / requestsPerSecond; 

      for (const product of productsInDB) {
        const newProduct = new shopify.api.rest.Product({ session: session });

        const metafields: {[index: string]: any} = {};

        for (const key in product) {
          switch (key) {
            case 'title':
                newProduct.title = product[key];
                break;

            case 'description':
                newProduct.body_html = product[key];
                break;

            case 'images':
                newProduct.images = product[key].map((image) => ({ src: image }));
                break;

            case 'properties':
                for (const property in product[key]) {
                  if (property === 'category') {
                    newProduct.product_type = product[key][property];
                    continue;
                  }

                  if (property === 'tags') {
                    newProduct.tags = product[key][property];
                    continue;
                  }

                  metafields[property] = product[key][property];
                }

            default:
                break;
          }
        }

        newProduct.variants = [{ price: product.price, inventory_quantity: product.quantity, sku: product.sku }];
        newProduct.published = false;
        await newProduct.save({
          update: true,
        });

        if (Object.keys(metafields).length) {
          for (const key in metafields) {
            if (!metafields[key]) continue;

            const metafield = new shopify.api.rest.Metafield({ session: session });
            metafield.namespace = 'stork';
            metafield.key = key;
            metafield.value = metafields[key];
            metafield.type = 'single_line_text_field';
            metafield.product_id = newProduct.id;
            await metafield.save({
              update: true,
            });
          }
        }

        const referenceProduct = await this.ReferenceModel.findOne({ stork_id: product.id });

        if (referenceProduct) {
          referenceProduct.shopify_products_ids[session.shop] = newProduct.id;
          await this.ReferenceModel.updateOne({ stork_id: referenceProduct.stork_id }, { shopify_products_ids: referenceProduct.shopify_products_ids });
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    } catch (err) {
      console.log(err)
    }
  }
}