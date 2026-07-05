export function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function toCents(value: number): number {
  return Math.round((Number(value) || 0) * 100);
}
