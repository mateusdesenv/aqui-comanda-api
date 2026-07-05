import { Model, SortOrder } from 'mongoose';
import { AppError } from '../errors/AppError';
import { ErrorCodes } from '../errors/error-codes';
import { buildPagination } from '../utils/api-response';

export interface ListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface TenantScope {
  tenantId: string;
  companyId: string;
  userId: string;
}

export interface CrudSearchConfig<T> {
  searchFields?: Array<keyof T | string>;
  defaultSort?: Record<string, SortOrder>;
}

export class CrudService<T = any> {
  constructor(
    private readonly model: Model<any>,
    private readonly config: CrudSearchConfig<T> = {},
  ) {}

  async list(scope: TenantScope, options: ListOptions = {}, extraFilter: Record<string, any> = {}) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const filter: Record<string, any> = {
      tenantId: scope.tenantId,
      deletedAt: null,
      ...extraFilter,
    };

    if (options.search && this.config.searchFields?.length) {
      const regex = new RegExp(options.search, 'i');
      filter.$or = this.config.searchFields.map((field) => ({ [field]: regex }));
    }

    const sort: any = options.sortBy
      ? { [options.sortBy]: options.sortOrder === 'desc' ? 'desc' : 'asc' }
      : (this.config.defaultSort ?? { createdAt: -1 });

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      this.model.countDocuments(filter),
    ]);

    return { items, pagination: buildPagination(page, limit, total) };
  }

  async getById(scope: TenantScope, id: string) {
    const item = await this.model.findOne({ _id: id, tenantId: scope.tenantId, deletedAt: null });

    if (!item) {
      throw new AppError(404, 'Registro nao encontrado.', ErrorCodes.NOT_FOUND);
    }

    return item;
  }

  async create(scope: TenantScope, payload: Partial<T>) {
    return this.model.create({
      ...payload,
      tenantId: scope.tenantId,
      companyId: scope.companyId,
      createdBy: scope.userId,
      updatedBy: scope.userId,
      deletedAt: null,
    });
  }

  async update(scope: TenantScope, id: string, payload: Record<string, any>) {
    const item = await this.model.findOneAndUpdate(
      { _id: id, tenantId: scope.tenantId, deletedAt: null },
      { ...payload, updatedBy: scope.userId },
      { new: true, runValidators: true },
    );

    if (!item) {
      throw new AppError(404, 'Registro nao encontrado.', ErrorCodes.NOT_FOUND);
    }

    return item;
  }

  async softDelete(scope: TenantScope, id: string) {
    const item = await this.model.findOneAndUpdate(
      { _id: id, tenantId: scope.tenantId, deletedAt: null },
      { deletedAt: new Date(), deletedBy: scope.userId, updatedBy: scope.userId },
      { new: true },
    );

    if (!item) {
      throw new AppError(404, 'Registro nao encontrado.', ErrorCodes.NOT_FOUND);
    }

    return item;
  }
}
