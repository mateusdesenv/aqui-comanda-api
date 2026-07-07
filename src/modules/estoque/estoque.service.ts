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

function buildProductLookupFilter(productIds: string[], tenantId: string) {
  const objectIds = productIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const orFilters: Record<string, unknown>[] = [{ legacyId: { $in: productIds } }];

  if (objectIds.length > 0) {
    orFilters.push({ _id: { $in: objectIds } });
  }

  return {
    tenantId,
    deletedAt: null,
    $or: orFilters,
  };
}

function findProductByPayloadId(products: any[], productId: string) {
  return products.find((product) => String(product._id) === productId || String(product.id) === productId || String(product.legacyId ?? '') === productId);
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
      const productIdList = [...productIds];
      const products = await ProdutoModel.find(buildProductLookupFilter(productIdList, scope.tenantId)).session(session);

      if (products.length !== productIds.size) {
        throw new AppError(404, 'A entrada contem produto inexistente.', ErrorCodes.NOT_FOUND);
      }

      const items = payload.items.map((item) => {
        const product = findProductByPayloadId(products, item.productId);

        if (!product) {
          throw new AppError(404, 'A entrada contem produto inexistente.', ErrorCodes.NOT_FOUND);
        }

        return {
          productId: String(product._id),
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
        const product = findProductByPayloadId(products, item.productId);

        if (!product) {
          throw new AppError(404, 'A entrada contem produto inexistente.', ErrorCodes.NOT_FOUND);
        }

        const currentStock = Number(product.stockQuantity ?? product.estoqueAtual) || 0;
        const currentCost = Number(product.costPrice) || 0;
        const nextStock = currentStock + item.quantity;
        const nextCost = nextStock > 0 ? (currentStock * currentCost + item.quantity * item.unitCost) / nextStock : item.unitCost;

        const updated = await ProdutoModel.updateOne(
          { _id: product._id, tenantId: scope.tenantId, deletedAt: null },
          {
            $set: {
              stockQuantity: nextStock,
              estoqueAtual: nextStock,
              costPrice: roundMoney(nextCost),
              updatedBy: scope.userId,
            },
          },
          { session, runValidators: true },
        );

        if (updated.matchedCount === 0) {
          throw new AppError(404, 'Produto nao encontrado para atualizacao de estoque.', ErrorCodes.NOT_FOUND);
        }
      }

      createdEntry = entry;
    });

    return createdEntry;
  } finally {
    await session.endSession();
  }
}
