import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Model } from "mongoose";
import shopify from "../../utils/shopify.ts";

import { Shop } from "../../schemas/shop.schema.ts";
import { Product } from "../../schemas/product.schema.ts";
import { Reference } from "../../schemas/reference.schema.ts";

import { shopifySession, ProductVariant, ChangedProduct } from "../../types.ts";

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
    const shops = await this.ShopModel.find({ authorized: true });

    for (const shop of shops) {
      const products = await fetch(`${process.env.STORK_API_URL_DEV}/products/full-data`, {
        method: "GET",
        headers: {Authorization: `Bearer ${shop.stork_token}`}
      })

      if (products.ok) {
        const productsJson = await products.json();
        const productsInDB = await this.ProductModel.find({ shop: shop.domain });

        const reworkedProducts = this.reworkProducts(productsJson.products, shop.domain);

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
          await this.updateProductsInStore(changedProducts, shop);
        }
      }
    }
  }

  async updateProductsInStore(changedProducts: ChangedProduct[], store: any) {
    const session: shopifySession = store.session;

    for (const product of changedProducts) {
      const productData = product.product;

      if (product.type === 'new') {
        const newProduct = new shopify.api.rest.Product({ session: session });

        const metafields: {[index: string]: any} = {};

        for (const key in product) {
          switch (key) {
            case 'title':
              newProduct.title = productData[key];
              break;

            case 'description':
              newProduct.body_html = productData[key];
              break;

            case 'images':
              newProduct.images = productData[key].map((image: string) => ({ src: image }));
              break;

            case 'properties':
              for (const property of productData[key]) {
                if (property.key === 'category') {
                  newProduct.product_type = property[key];
                  continue;
                }

                if (property.key === 'tags') {
                  newProduct.tags = property[key];
                  continue;
                }

                metafields[property.key] = property.value;
              }

            default:
              break;
          }
        }

        newProduct.variants = [{ price: productData.price, inventory_quantity: productData.quantity, sku: productData.sku }];
        newProduct.published = false;
        await newProduct.save({
          update: true,
        });

        if (Object.keys(metafields).length) {
          for (const key in metafields) {
            const metafield = new shopify.api.rest.Metafield({ session: session });
            metafield.namespace = 'stork';
            metafield.key = key;
            metafield.value = metafields[key];
            metafield.value_type = 'string';
            metafield.owner_resource = 'product';
            metafield.owner_id = newProduct.id;
            await metafield.save({
              update: true,
            });
          }
        }

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

  reworkProducts(products: any[], shop: string) {
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
        properties: {},
        shop: shop
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
