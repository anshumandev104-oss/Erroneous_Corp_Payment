export interface SettlementWindow {
  hard_settlement_iso: string;
  settlement_cycle: 'BECS_EOD' | 'BECS_INTRADAY';
}

const OVERRIDES: Record<string, SettlementWindow> = {
  KLY654: {
    hard_settlement_iso: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    settlement_cycle: 'BECS_INTRADAY',
  },
};

/**
 * Returns the settlement window for a given reference_id.
 * Default: BECS EOD cutoff at 17:00 AEDT on today's date.
 */
export function getSettlementWindow(reference_id: string): SettlementWindow {
  if (OVERRIDES[reference_id.toUpperCase()]) {
    return OVERRIDES[reference_id.toUpperCase()];
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  return {
    hard_settlement_iso: `${todayStr}T17:00:00+11:00`,
    settlement_cycle: 'BECS_EOD',
  };
}
