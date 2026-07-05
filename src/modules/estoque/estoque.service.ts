import mongoose from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { ErrorCodes } from '../../common/errors/error-codes';
import { TenantScope } from '../../common/crud/crud.service';
import { roundMoney } from '../../common/utils/money';
import { ProdutoModel } from '../produtos/produto.model';
import { StockEntryModel } from './stock-entry.model';

interface StockEntryPayload {
  legacyId?: string;
  date: string;
  notes?: string;
  supplierName?: string;
  items: Array<{ productId: string; quantity: number; unitCost: number }>;
}

export async function createStockEntry(scope: TenantScope, payload: StockEntryPayload) {
  const productIds = new Set<string>();
  for (const item of payload.items) {
    if (productIds.has(item.productId)) {
      throw new AppError(400, 'Nao e permitido lancar o mesmo produto duas vezes na mesma entrada.', ErrorCodes.VALIDATION_ERROR);
    }
    productIds.add(item.productId);
  }

  const session = await mongoose.startSession();

  try {
    let createdEntry;
    await session.withTransaction(async () => {
      const products = await ProdutoModel.find({ _id: { $in: [...productIds] }, tenantId: scope.tenantId, deletedAt: null }).session(session);

      if (products.length !== productIds.size) {
        throw new AppError(404, 'A entrada contem produto inexistente.', ErrorCodes.NOT_FOUND);
      }

      const items = payload.items.map((item) => {
        const product = products.find((current) => current.id === item.productId)!;
        return {
          productId: product.id,
          productName: product.nome,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: roundMoney(item.quantity * item.unitCost),
        };
      });

      const [entry] = await (StockEntryModel as any).create(
        [
          {
            legacyId: payload.legacyId,
            tenantId: scope.tenantId,
            companyId: scope.companyId,
            createdBy: scope.userId,
            updatedBy: scope.userId,
            date: new Date(payload.date),
            notes: payload.notes,
            supplierName: payload.supplierName,
            totalCost: roundMoney(items.reduce((total, item) => total + item.totalCost, 0)),
            items,
            deletedAt: null,
          },
        ],
        { session },
      );

      for (const item of items) {
        const product = products.find((current) => current.id === item.productId)!;
        const currentStock = Number(product.stockQuantity) || 0;
        const currentCost = Number(product.costPrice) || 0;
        const nextStock = currentStock + item.quantity;
        const nextCost = nextStock > 0 ? (currentStock * currentCost + item.quantity * item.unitCost) / nextStock : item.unitCost;
        await ProdutoModel.updateOne(
          { _id: product.id, tenantId: scope.tenantId },
          { stockQuantity: nextStock, costPrice: nextCost, updatedBy: scope.userId },
          { session },
        );
      }

      createdEntry = entry;
    });

    return createdEntry;
  } finally {
    await session.endSession();
  }
}
