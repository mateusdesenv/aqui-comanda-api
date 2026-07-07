import { InferSchemaType, Schema, model } from 'mongoose';
import { tenantFields } from '../../common/mongoose/base-fields';

const backupJobSchema = new Schema(
  {
    ...tenantFields,
    type: { type: String, enum: ['export', 'import'], required: true },
    mode: { type: String, enum: ['replace', 'merge'], default: 'replace' },
    moduleId: String,
    status: { type: String, enum: ['success', 'failed'], required: true },
    message: String,
    collections: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type BackupJob = InferSchemaType<typeof backupJobSchema>;
export const BackupJobModel = model('BackupJob', backupJobSchema, 'backup_jobs');
