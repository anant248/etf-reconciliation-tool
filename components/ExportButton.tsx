"use client";

import { ReconciliationResult } from "@/lib/reconcile";

type Props = { result: ReconciliationResult };

export default function ExportButton({ result }: Props) {
  function handleExport() {
    const lines: string[] = [];
    lines.push("Exception Type,CUSIP,Ticker,Security Name,Field,Vendor Value,Internal Value,Delta");

    for (const row of result.rows) {
      if (row.status === "mismatched") {
        const r = row.vendorRow ?? row.internalRow ?? {};
        for (const d of row.diffs ?? []) {
          lines.push(
            [
              "Mismatched",
              row.key,
              r["Ticker"] ?? "",
              `"${r["Security Name"] ?? ""}"`,
              d.field,
              d.vendorValue,
              d.internalValue,
              d.delta !== null ? d.delta.toFixed(4) : "",
            ].join(",")
          );
        }
      } else if (row.status === "unmatched") {
        const r = row.vendorRow ?? row.internalRow ?? {};
        const side = row.side === "vendor_only" ? "Vendor Only" : "Internal Only";
        lines.push(
          [
            `Unmatched (${side})`,
            row.key,
            r["Ticker"] ?? "",
            `"${r["Security Name"] ?? ""}"`,
            "",
            row.vendorRow ? r["Market Value"] ?? "" : "",
            row.internalRow ? r["Market Value"] ?? "" : "",
            "",
          ].join(",")
        );
      }
    }

    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reconciliation-exceptions-${ts}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const exceptionCount =
    result.summary.mismatched + result.summary.unmatchedVendorOnly + result.summary.unmatchedInternalOnly;

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 rounded-lg border border-[#E1E1E1] bg-white px-4 py-2 text-sm font-medium text-[#191919] hover:bg-[#f6f6f6] hover:border-[#C0C0C0] transition-all"
    >
      <svg className="h-4 w-4 text-[#626262]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export Exceptions
      <span className="rounded-full bg-[#FFDACC] px-2 py-0.5 text-xs font-semibold text-[#CC4A00]">
        {exceptionCount}
      </span>
    </button>
  );
}
