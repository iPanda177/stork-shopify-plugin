import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { config } from "dotenv";
config();

@Injectable()
export class ProductsService {
  constructor() {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async getProducts() {
    const products = await fetch(`${process.env.STORK_API_URL}/products/full-data`, {
      method: "GET",
      headers: {Authorization: `Bearer ${process.env.STORK_API_KEY}`}
    })

    if (products.ok) {
      const productsJson = await products.json();
    }
  }
}
