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
  
  @Prop()
  category: string;
  
  @Prop({ required: true })
  quantity: number;
  
  @Prop({ required: true })
  images: string[];
  
  @Prop()
  brand: string;
  
  @Prop()
  condition: string;
  
  @Prop()
  gender: string;
  
  @Prop()
  setting_type: string;
  
  @Prop()
  country: string;
  
  @Prop()
  bracelet_length: string;

  bracelet_style: string;
  
  @Prop()
  stones__1: string;
  
  @Prop()
  stones__1__carat_weight: number;
  
  @Prop()
  metal_type: string;
  
  @Prop({ nullable: true })
  msrp: number;
  
  @Prop({ required: true })
  price: number;
}

export const ProductsSchema = SchemaFactory.createForClass(Product);