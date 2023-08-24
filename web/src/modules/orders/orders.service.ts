import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Product } from "../../schemas/product.schema.js";
import { Reference } from "../../schemas/reference.schema.js";

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Reference.name) private ReferenceModel: Model<Reference>,
    @InjectModel(Product.name) private ProductModel: Model<Product>, 
  ) {}

  async handleOrderPaid(body: any, shopDomain: string) {
    const { order_number, shipping_address, line_items, note } = body;

    const referenceList = await this.ReferenceModel.find({});
  
    const products = await Promise.all(line_items.map(async (item: any) => {
      const reference = referenceList.find((ref: any) => ref.shopify_products_ids[shopDomain] === item.product_id);
      if (!reference) {
        return;
      }

      const product = await this.ProductModel.findOneAndUpdate({ id: reference.stork_id }, { $inc: { quantity: -item.quantity } }, { new: true });
      console.log(product)
      if (!product) {
        return;
      }

      return { product: product.id, quantity: item.quantity, sku: product.sku };
    }));

    const filteredProducts = products.filter((product: any) => !!product);

    if (!filteredProducts.length) {
      return;
    }

    const orderData = [{
      products: filteredProducts,
      notes: note,
      externalOrderId: order_number,
      shippingDetails: {
        address: shipping_address?.address1 || null,
        city: shipping_address?.city || null,
        country: shipping_address?.country || null,
        state: shipping_address?.province || null,
        apartment: shipping_address?.address2 || null,
      }
    }]

    console.log(orderData);
  }
}
