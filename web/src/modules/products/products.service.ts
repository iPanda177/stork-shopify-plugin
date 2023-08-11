import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";

import { config } from "dotenv";
import { Model } from "mongoose";
import { Product } from "./product.schema.js";
config();

type ChangedProduct = {
  type: string;
  product: Product;
  fields?: string[];
}

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private ProductModel: Model<Product>) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async getProducts() {
    const products = await fetch(`${process.env.STORK_API_URL}/products/full-data`, {
      method: "GET",
      headers: {Authorization: `Bearer ${process.env.STORK_API_KEY}`}
    })

    if (products.ok) {
      const productsJson = await products.json();
      const productsInDB = await this.ProductModel.find({});

      const changedProducts = [];

      if (!productsInDB.length) {
        await this.ProductModel.insertMany(productsJson.products);
      }

      for (const product of productsJson.products) {
        const productInDB = productsInDB.find((p) => p.id === product.id);

        if (!productInDB) {
          await this.ProductModel.create(product);
          changedProducts.push({ type: 'New', product: product });
          continue;
        }

        for (const key in product) {
          const changedProduct: ChangedProduct = {
            type: 'update',
            product: product,
            fields: [],
          };

          if (key === 'images') {
            for (const image of product[key]) {
              if (!productInDB[key].includes(image)) {
                await this.ProductModel.updateOne({ id: product.id }, { images: product[key] });
                changedProduct.fields?.push(key);
              }
            }
          } else if (productInDB[key as keyof Product] !== product[key]) {
            await this.ProductModel.updateOne({ id: product.id }, { [key]: product[key] });
            changedProduct.fields?.push(key);
          }

          if (changedProduct.fields?.length) {
            changedProducts.push(changedProduct);
          }
        }
              
        productsInDB.splice(productsInDB.indexOf(productInDB), 1);
      }

      if (productsInDB.length) {
        for (const product of productsInDB) {
          await this.ProductModel.deleteOne({ id: product.id });
          changedProducts.push({ type: 'delete', product: product });
        }
      }

      if (changedProducts.length) {
        await this.updateProductsInStores(changedProducts);
      }
    }
  }

  async updateProductsInStores(products: ChangedProduct[]) {

  }
}
