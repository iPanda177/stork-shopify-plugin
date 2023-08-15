import { Prop, SchemaFactory, Schema } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ReferenceDocument = HydratedDocument<Reference>;

@Schema()
export class Reference {
  @Prop({ required: true })
  stork_id: number;

  @Prop({ default: {}, type: Object })
  shopify_products_ids: { [key: string]: number };
}

export const ReferenceSchema = SchemaFactory.createForClass(Reference);