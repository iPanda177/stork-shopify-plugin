import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ShopDocument = HydratedDocument<Shop>;

@Schema()
export class Shop {
  @Prop()
  shop: string;

  @Prop()
  accessToken: string;

  @Prop({ default: false })
  authorized: boolean;

  @Prop({ type: Object })
  session: object;
}

export const ShopSchema = SchemaFactory.createForClass(Shop);