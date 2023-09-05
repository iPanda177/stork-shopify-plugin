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

import shopify from "./utils/shopify.ts";
import GDPRWebhookHandlers from "./utils/gdpr.ts";

import { initializeShop } from "./middlewares/initialize-shop.middleware.ts";

import { ProductsModule } from "./modules/products/products.module.ts";
import { ScheduleModule } from "@nestjs/schedule";
import { ShopModule } from "./modules/shop/shop.module.ts";
import { OrdersModule } from "./modules/orders/orders.module.ts";

import * as dotenv from 'dotenv';
import { MandatoryModule } from "./modules/mandatory/mandatory.module.ts";
dotenv.config();

console.log(process.env.MONGO_URI_DEV!)

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI!),
    ScheduleModule.forRoot(),
    ShopModule,
    ProductsModule,
    OrdersModule,
    MandatoryModule,
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
        { path: "/api/product/check-qty", method: RequestMethod.POST },
        { path: "/api/mandatory/(.*)", method: RequestMethod.POST },
        { path: "/api/webhooks", method: RequestMethod.POST },
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
        { path: "/api/mandatory/(.*)", method: RequestMethod.ALL },
        { path: "/api/product/check-qty", method: RequestMethod.POST },
        { path: "/api/webhooks", method: RequestMethod.POST },
      )
      .forRoutes({ path: "/*", method: RequestMethod.ALL });

    consumer
      .apply(initializeShop)
      .forRoutes({ path: "/api/shop", method: RequestMethod.ALL });
  }
}
