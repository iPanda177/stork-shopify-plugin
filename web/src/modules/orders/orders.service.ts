import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Product } from "../../schemas/product.schema.ts";
import { Reference } from "../../schemas/reference.schema.ts";
import { Shop } from "../../schemas/shop.schema.ts";
import shopify from "../../utils/shopify.ts";

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Reference.name) private ReferenceModel: Model<Reference>,
    @InjectModel(Product.name) private ProductModel: Model<Product>,
    @InjectModel(Shop.name) private ShopModel: Model<Shop>,
  ) {}

  async handleOrderPaid(body: any, shopDomain: string) {
    const { id, shipping_address, line_items, note, customer } = body;

    const shop = await this.ShopModel.findOne({ domain: shopDomain });

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

      return { product: product.id, quantity: item.quantity, external_product_id: item.product_id, line_item_id: item.id };
    }));

    const filteredProducts = products.filter((product: any) => !!product);

    if (!filteredProducts.length) {
      return;
    }

    const orderData = {
      external_order_id: id,
      notes: note || null,
      sales_channel: "shopify",
      shop_domain: shopDomain,
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
        Authorization: `Bearer ${shop?.stork_token || process.env.STORK_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    })

    console.log(sendOrder.body, sendOrder.status, sendOrder);
  }

  async handleOrderFulfilled(external_order_id: string, tracking_info: any, products: any, shopDomain: string) {
    const shop = await this.ShopModel.findOne({ domain: shopDomain });

    if (!shop) {
      return;
    }

    const fulfillmentOrders = await shopify.api.rest.FulfillmentOrder.all({
      session: shop.session,
      order_id: external_order_id,
    });

    if (!fulfillmentOrders.length) {
      return;
    }

    const fullfillmentArray = fulfillmentOrders.map((fulfillmentOrder: any) => {
      return {
        fulfillment_order_id: fulfillmentOrder.id,
        fulfillment_order_line_items: fulfillmentOrder.line_items.map((line_item: any) => {
          const hasProduct = products.find((product: any) => product.line_item_id === line_item.id);

          if (!hasProduct) {
            return;
          }

          return {
            id: line_item.id,
            quantity: hasProduct.quantity,
          }
        }),
      }
    });

    const fulfillment = new shopify.api.rest.Fulfillment({session: shop.session});
    fulfillment.line_items_by_fulfillment_order = fullfillmentArray;
      fulfillment.tracking_info = {
        "number": tracking_info.number,
        "company": tracking_info.company,
        "url": tracking_info.url,
      };
    await fulfillment.save({
      update: true,
    });
  }
}
