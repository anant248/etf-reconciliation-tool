export type Diff = {
  field: string;
  vendorValue: string;
  internalValue: string;
  delta: number | null;
};

export type ReconciliationRow = {
  key: string;
  status: "matched" | "mismatched" | "unmatched";
  side?: "vendor_only" | "internal_only";
  vendorRow?: Record<string, string>;
  internalRow?: Record<string, string>;
  diffs?: Diff[];
};

export type ReconciliationResult = {
  rows: ReconciliationRow[];
  summary: {
    total: number;
    matched: number;
    mismatched: number;
    unmatchedVendorOnly: number;
    unmatchedInternalOnly: number;
    totalDiffs: number;
  };
  keyColumn: string;
  timestamp: string;
  vendorFileName: string;
  internalFileName: string;
  tolerance: number;
};

function parseNumber(val: string): number | null {
  const cleaned = val.replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export function reconcile(
  vendorRows: Record<string, string>[],
  internalRows: Record<string, string>[],
  keyColumn: string,
  vendorFileName: string,
  internalFileName: string,
  tolerance = 0.01
): ReconciliationResult {
  const vendorMap = new Map<string, Record<string, string>>();
  const internalMap = new Map<string, Record<string, string>>();

  for (const row of vendorRows) {
    const key = row[keyColumn];
    if (key) vendorMap.set(key.trim(), row);
  }
  for (const row of internalRows) {
    const key = row[keyColumn];
    if (key) internalMap.set(key.trim(), row);
  }

  const allKeys = new Set([...vendorMap.keys(), ...internalMap.keys()]);
  const results: ReconciliationRow[] = [];

  for (const key of allKeys) {
    const vRow = vendorMap.get(key);
    const iRow = internalMap.get(key);

    if (!vRow) {
      results.push({ key, status: "unmatched", side: "internal_only", internalRow: iRow });
      continue;
    }
    if (!iRow) {
      results.push({ key, status: "unmatched", side: "vendor_only", vendorRow: vRow });
      continue;
    }

    const sharedFields = Object.keys(vRow).filter(
      (f) => f !== keyColumn && f in iRow
    );
    const diffs: Diff[] = [];

    for (const field of sharedFields) {
      const vVal = vRow[field]?.trim() ?? "";
      const iVal = iRow[field]?.trim() ?? "";
      if (vVal === iVal) continue;

      const vNum = parseNumber(vVal);
      const iNum = parseNumber(iVal);

      if (vNum !== null && iNum !== null) {
        const delta = Math.abs(vNum - iNum);
        if (delta <= tolerance) continue;
        diffs.push({ field, vendorValue: vVal, internalValue: iVal, delta: iNum - vNum });
      } else {
        diffs.push({ field, vendorValue: vVal, internalValue: iVal, delta: null });
      }
    }

    if (diffs.length === 0) {
      results.push({ key, status: "matched", vendorRow: vRow, internalRow: iRow });
    } else {
      results.push({ key, status: "mismatched", vendorRow: vRow, internalRow: iRow, diffs });
    }
  }

  const matched = results.filter((r) => r.status === "matched").length;
  const mismatched = results.filter((r) => r.status === "mismatched").length;
  const unmatchedVendorOnly = results.filter((r) => r.status === "unmatched" && r.side === "vendor_only").length;
  const unmatchedInternalOnly = results.filter((r) => r.status === "unmatched" && r.side === "internal_only").length;
  const totalDiffs = results.reduce((acc, r) => acc + (r.diffs?.length ?? 0), 0);

  return {
    rows: results,
    summary: {
      total: results.length,
      matched,
      mismatched,
      unmatchedVendorOnly,
      unmatchedInternalOnly,
      totalDiffs,
    },
    keyColumn,
    timestamp: new Date().toISOString(),
    vendorFileName,
    internalFileName,
    tolerance,
  };
}

export function detectKeyColumn(headers: string[]): string {
  const preferred = ["CUSIP", "cusip", "Cusip", "ISIN", "isin", "Ticker", "ticker", "ID", "id"];
  for (const p of preferred) {
    if (headers.includes(p)) return p;
  }
  return headers[0];
}
