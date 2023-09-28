import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Product } from "../../schemas/product.schema.ts";
import { Reference } from "../../schemas/reference.schema.ts";

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Reference.name) private ReferenceModel: Model<Reference>,
    @InjectModel(Product.name) private ProductModel: Model<Product>, 
  ) {}

  async handleOrderPaid(body: any, shopDomain: string) {
    const { order_number, shipping_address, line_items, note, customer } = body;

    const referenceList = await this.ReferenceModel.find({});
  
    const products = await Promise.all(line_items.map(async (item: any) => {
      const reference = referenceList.find((ref: any) => ref.shopify_products_ids[shopDomain] === item.product_id);
      if (!reference) {
        return;
      }

      const product = await this.ProductModel.findOneAndUpdate({ id: reference.stork_id }, { $inc: { quantity: -item.quantity } }, { new: true });
      if (!product) {
        return;
      }

      return { product: product.id, quantity: item.quantity };
    }));

    const filteredProducts = products.filter((product: any) => !!product);

    if (!filteredProducts.length) {
      return;
    }

    const orderData = {
      external_order_id: order_number,
      notes: note || null,
      sales_channel: "shopify",
      products: filteredProducts,
      address: {
        address: shipping_address?.address1 || null,
        city: shipping_address?.city || null,
        country: shipping_address?.country || null,
        zipcode: shipping_address.zip || null,
        state: shipping_address?.province || null,
        apartment: shipping_address?.address2 || null,
        first_name: shipping_address?.first_name || null,
        last_name: shipping_address?.last_name || null,
        email: customer?.email || null,
        phone: shipping_address?.phone || null,
      }
    }

    const sendOrder = await fetch(`${process.env.STORK_API_URL_DEV}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STORK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    })

    console.log(sendOrder.body, sendOrder.status, sendOrder);
  }
}
