import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Model } from "mongoose";
import shopify from "../../utils/shopify.js";

import { Shop } from "../../schemas/shop.schema.js";
import { Product } from "../../schemas/product.schema.js";
import { Reference } from "../../schemas/reference.schema.js";

import { shopifySession, ProductVariant, ChangedProduct } from "../../types.js";

import { config } from "dotenv";
config();

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private ProductModel: Model<Product>, 
    @InjectModel(Shop.name) private ShopModel: Model<Shop>,
    @InjectModel(Reference.name) private ReferenceModel: Model<Reference>,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkProducts() {
    const products = await fetch(`${process.env.STORK_API_URL}/products/full-data`, {
      method: "GET",
      headers: {Authorization: `Bearer ${process.env.STORK_API_KEY}`}
    })

    if (products.ok) {
      const productsJson = await products.json();
      const productsInDB = await this.ProductModel.find({});

      const reworkedProducts = this.reworkProducts(productsJson.products);

      const changedProducts = [];

      if (!productsInDB.length) {
        const referenceProducts = reworkedProducts.map((product) => {
          const referenceProduct = {
            stork_id: product.id,
            shopify_products_ids: {},
          };

          return referenceProduct;
        });

        await this.ProductModel.insertMany(reworkedProducts);
        await this.ReferenceModel.insertMany(referenceProducts);
        return;
      }

      for (const product of reworkedProducts) {
        const productInDB = productsInDB.find((p) => p.id === product.id);

        if (!productInDB) {
          await this.ProductModel.create(product);
          await this.ReferenceModel.create({ stork_id: product.id, shopify_products_ids: {} });
          changedProducts.push({ type: 'new', product: product });
          continue;
        }

        for (const key in product) {
          const changedProduct: ChangedProduct = {
            type: 'update',
            product: product,
            fields: [],
          };

          if (key === 'properties') {
            for (const property in product[key]) {
              if (productInDB.properties[property] !== product[key][property]) {
                await this.ProductModel.updateOne({ id: product.id }, { [`properties.${property}`]: product[key][property] });
                changedProduct.fields?.push(property);
              }
            }
          } else if (key === 'images') {
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

  async updateProductsInStores(changedProducts: ChangedProduct[]) {
    const stores = await this.ShopModel.find({ authorized: true });

    for (const store of stores) {
      const session: shopifySession = store.session;

      for (const product of changedProducts) {
        const productData = product.product;

        if (product.type === 'new') {
          const newProduct = new shopify.api.rest.Product({ session: session });
          newProduct.title = productData.title;
          newProduct.body_html = productData.description;
          newProduct.images = productData.images.map((image: string) => ({ src: image }));
          newProduct.variants = [{ price: productData.price, inventory_quantity: productData.quantity, sku: productData.sku }];
          newProduct.product_type = productData.properties.type;
          newProduct.published = false;
          await newProduct.save({
            update: true,
          });

          const productReference = await this.ReferenceModel.findOne({ stork_id: productData.id });

          if (productReference) {
            productReference.shopify_products_ids[session.shop] = newProduct.id;
            await productReference.save();
          }

          if (!productReference) {
            const referenceProduct = {
              stork_id: productData.id,
              shopify_products_ids: {
                [session.shop]: newProduct.id,
              },
            };

            await this.ReferenceModel.create(referenceProduct);
          }
        } else if (product.type === 'update' && product.fields) {
          const referenceProduct = await this.ReferenceModel.findOne({ stork_id: productData.id });
          
          if (!referenceProduct) {
            continue;
          }

          const shopifyProductID = referenceProduct.shopify_products_ids[session.shop];

          const shopifyProduct = await shopify.api.rest.Product.find({ 
            session: session,
            id: shopifyProductID,
          });

          for (const field of product.fields) {
            switch (field) {
              case 'title':
                shopifyProduct.title = productData.title;
                break;

              case 'description':
                shopifyProduct.body_html = productData.description;
                break;
              
              case 'images':
                shopifyProduct.images = productData.images.map((image: string) => ({ src: image }));
                break;

              case 'price':
              case 'quantity':
              case 'sku':
                shopifyProduct.variants = [{ price: productData.price, inventory_quantity: productData.quantity, sku: productData.sku }];
                break;

              case 'type':
                shopifyProduct.product_type = productData.properties.type;
                break;

              default:
                break;
            }

            await shopifyProduct.save({
              update: true,
            });
          }
        } else if (product.type === 'delete') {
          const productReference = await this.ReferenceModel.findOne({ stork_id: productData.id });

          if (productReference) {
            const shopifyProductsIds = productReference.shopify_products_ids;

            const shopifyProduct = await new shopify.api.rest.Product.delete({ 
              session: session,
              id: shopifyProductsIds[session.shop], 
            });

            if (shopifyProduct.ok) {
              const updatedShopifyProductIds = Object.keys(shopifyProductsIds).reduce((acc: any, key) => {
                if (key !== session.shop) {
                  acc[key] = shopifyProductsIds[key];
                }

                return acc;
              }, {});
  
              await this.ReferenceModel.updateOne({ stork_id: productData.id }, { shopify_products_ids: updatedShopifyProductIds });
            }
          }
        }
      }
    }
  }

  reworkProducts(products: any[]) {
    return products.map((product) => {
      const reworkedProduct: any = {
        id: product.id,
        sku: product.sku,
        price: product.price,
        msrp: product.msrp,
        quantity: product.quantity,
        title: product.title,
        description: product.description,
        images: product.images,
        properties: {}
      };
  
      for (const key in product) {
        if (!reworkedProduct[key]) {
          reworkedProduct.properties[key] = product[key];
        }
      }
  
      return reworkedProduct;
    })
  }

  async checkProductQty(products: ProductVariant[], shop: string) {
    const shopData = await this.ShopModel.findOne({ domain: shop });

    if (!shopData) {
      throw new HttpException('Shop not found', HttpStatus.NOT_FOUND);
    }

    const session: shopifySession = shopData.session;

    for (const product of products) {
      const shopifyVariant = await shopify.api.rest.Variant.find({
        session: session,
        id: +product.id,
      });
    
      if (!shopifyVariant) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
  
      const referenceList = await this.ReferenceModel.find({});
      const reference = referenceList.find((ref) => ref.shopify_products_ids[shop] === shopifyVariant.product_id);
      
      if (!reference) {
        throw new HttpException('Reference not found', HttpStatus.NOT_FOUND);
      }
  
      const storkProduct = await this.ProductModel.findOne({ id: reference.stork_id });
  
      if (!storkProduct) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
  
      if (storkProduct.quantity < +product.quantity) {
        return false;
      }
    }

    return true;
  }
}
