import { InferSchemaType, Schema, model } from 'mongoose';
import { tenantFields } from '../../common/mongoose/base-fields';

const stockEntryItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const stockEntrySchema = new Schema(
  {
    ...tenantFields,
    date: { type: Date, required: true, index: true },
    notes: String,
    supplierName: String,
    totalCost: { type: Number, default: 0 },
    items: { type: [stockEntryItemSchema], default: [] },
  },
  { timestamps: true, strict: false },
);

stockEntrySchema.index({ tenantId: 1, date: -1 });

export type StockEntry = InferSchemaType<typeof stockEntrySchema>;
export const StockEntryModel = model('StockEntry', stockEntrySchema, 'stock_entries');
