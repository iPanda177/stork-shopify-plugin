import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { shopifySession } from "../types";

export type ShopDocument = HydratedDocument<Shop>;

@Schema()
export class Shop {
  @Prop({ required: true })
  domain: string;

  @Prop({ default: false })
  authorized: boolean;

  @Prop({ type: Object })
  session: shopifySession;

  @Prop()
  stork_token: string;
}

export const ShopSchema = SchemaFactory.createForClass(Shop);