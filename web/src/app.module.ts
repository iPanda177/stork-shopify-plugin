import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import { Request, Response, NextFunction } from "express";
import { join } from "path";
import { readFileSync } from "fs";

import shopify from "./utils/shopify.js";
import GDPRWebhookHandlers from "./utils/gdpr.js";

import { initializeShop } from "./middlewares/initialize-shop.middleware.js";

import { ProductsModule } from "./modules/products/products.module.js";
import { ScheduleModule } from "@nestjs/schedule";
import { ShopModule } from "./modules/shop/shop.module.js";
import { OrdersModule } from "./modules/orders/orders.module.js";

import * as dotenv from 'dotenv';
dotenv.config();

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI_DEV!),
    ScheduleModule.forRoot(),
    ShopModule,
    ProductsModule,
    OrdersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Authentication Middleware
    consumer.apply(shopify.auth.begin()).forRoutes({
      path: shopify.config.auth.path,
      method: RequestMethod.GET,
    });
    consumer.apply(shopify.auth.callback()).forRoutes({
      path: shopify.config.auth.callbackPath,
      method: RequestMethod.GET,
    });
    consumer.apply(shopify.redirectToShopifyOrAppRoot()).forRoutes({
      path: shopify.config.auth.callbackPath,
      method: RequestMethod.GET,
    })

    // Validate Authenticated Session Middleware for Backend Routes
    consumer
      .apply(shopify.validateAuthenticatedSession())
      .exclude(
        { path: "/api/orders", method: RequestMethod.POST },
        { path: "/api/product/check-qty", method: RequestMethod.GET },
      )
      .forRoutes({ path: "/api/*", method: RequestMethod.ALL });

    // Webhooks
    consumer
      .apply(
        ...shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
      )
      .forRoutes({
        path: shopify.config.webhooks.path,
        method: RequestMethod.POST,
      });

    // Ensure Installed On Shop Middleware for Client Routes.
    // Except for backend routes /api/(.*)
    consumer
      .apply(
        shopify.ensureInstalledOnShop(),
        (_req: Request, res: Response, _next: NextFunction) => {
          return res
            .status(200)
            .set("Content-Type", "text/html")
            .send(readFileSync(join(STATIC_PATH, "index.html")));
        }
      )
      .exclude(
        { path: "/api/(.*)", method: RequestMethod.ALL },
      )
      .forRoutes({ path: "/*", method: RequestMethod.ALL });

    consumer
      .apply(initializeShop)
      .forRoutes({ path: "/api/shop", method: RequestMethod.ALL });
  }
}
