import { InferSchemaType, Schema, model } from 'mongoose';

const settingSchema = new Schema(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true },
    uiScale: { type: String, enum: ['mini', 'tiny', 'small', 'medium', 'large'], default: 'medium' },
    menuOrder: { type: [String], default: [] },
    createdBy: String,
    updatedBy: String,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type Setting = InferSchemaType<typeof settingSchema>;
export const SettingModel = model('Setting', settingSchema, 'settings');
