import { Schema, SchemaDefinition } from 'mongoose';

export interface TenantDocumentFields {
  tenantId: string;
  companyId?: string;
  legacyId?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  deletedAt?: Date | null;
  extraFields?: Record<string, unknown>;
}

export const tenantFields: SchemaDefinition = {
  tenantId: { type: String, required: true, index: true },
  companyId: { type: String, index: true },
  legacyId: { type: String, index: true },
  createdBy: String,
  updatedBy: String,
  deletedBy: String,
  deletedAt: { type: Date, default: null, index: true },
  extraFields: { type: Schema.Types.Mixed, default: undefined },
};
