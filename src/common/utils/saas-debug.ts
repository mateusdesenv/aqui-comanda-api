export function debugSaasContext(event: string, details: Record<string, unknown>): void {
  if (process.env.DEBUG_SAAS_CONTEXT !== 'true') {
    return;
  }

  console.info(`[saas-context] ${event}`, details);
}
