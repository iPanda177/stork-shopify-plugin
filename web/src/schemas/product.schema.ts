import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ProductsDocument = HydratedDocument<Product>;

@Schema()
export class Product {
  @Prop({ required: true })
  id: number;
  
  @Prop({ required: true })
  title: string;
  
  @Prop({ required: true })
  sku: string;
  
  @Prop({ required: true })
  description: string;
  
  @Prop({ required: true })
  quantity: number;
  
  @Prop({ required: true })
  images: string[];
  
  @Prop({ nullable: true })
  msrp: number;
  
  @Prop({ required: true })
  price: number;

  @Prop({ type: Object })
  properties: any;
}

export const ProductsSchema = SchemaFactory.createForClass(Product);