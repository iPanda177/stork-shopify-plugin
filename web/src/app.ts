import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.ts";
import {
  ExpressAdapter,
  NestExpressApplication,
} from "@nestjs/platform-express";
import { Express } from "express";
import { ValidationPipe } from "@nestjs/common";

// const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "", 10);
const PORT = 6262;
console.log(PORT);
const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

export class App {
  public async start(server: Express) {
    const app = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(server)
    );
    app.useGlobalPipes(new ValidationPipe());
    app.useStaticAssets(STATIC_PATH, { index: false });
    app.enableCors();
    await app.listen(PORT);
  }
}
