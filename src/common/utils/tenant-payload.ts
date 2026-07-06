const protectedTenantFields = new Set([
  'tenantId',
  'companyId',
  'ownerId',
  'accountId',
  'organizationId',
  'createdBy',
  'updatedBy',
  'deletedBy',
  'deletedAt',
]);

export function stripTenantProtectedFields<T extends Record<string, any>>(payload: T): Partial<T> {
  return Object.entries(payload ?? {}).reduce<Record<string, any>>((clean, [key, value]) => {
    if (!protectedTenantFields.has(key)) {
      clean[key] = value;
    }

    return clean;
  }, {}) as Partial<T>;
}
