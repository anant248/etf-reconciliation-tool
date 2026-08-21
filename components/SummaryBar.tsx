import { ReconciliationResult } from "@/lib/reconcile";
import { formatTimestamp } from "@/lib/format";

type Props = { result: ReconciliationResult };

export default function SummaryBar({ result }: Props) {
  const { summary, timestamp, vendorFileName, internalFileName, keyColumn, tolerance } = result;
  const unmatched = summary.unmatchedVendorOnly + summary.unmatchedInternalOnly;

  return (
    <div className="rounded-xl border border-[#E1E1E1] bg-white p-5">
      {/* top row: counts */}
      <div className="flex flex-wrap gap-4 items-center">
        <Stat label="Total Positions" value={summary.total} color="neutral" />
        <div className="h-8 w-px bg-[#E1E1E1]" />
        <Stat label="Matched" value={summary.matched} color="green" />
        <Stat
          label="Mismatched"
          value={summary.mismatched}
          color="orange"
          sub={summary.mismatched > 0 ? `${summary.totalDiffs} field diff${summary.totalDiffs !== 1 ? "s" : ""}` : undefined}
        />
        <Stat
          label="Unmatched"
          value={unmatched}
          color="red"
          sub={unmatched > 0 ? `${summary.unmatchedVendorOnly} vendor-only · ${summary.unmatchedInternalOnly} internal-only` : undefined}
        />
      </div>

      {/* bottom row: metadata */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-[#E1E1E1] pt-4">
        <Meta label="Vendor" value={vendorFileName} />
        <Meta label="Internal" value={internalFileName} />
        <Meta label="Key" value={keyColumn} />
        <Meta label="Tolerance" value={`±${tolerance}`} />
        <Meta label="Run at" value={formatTimestamp(timestamp)} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number;
  color: "neutral" | "green" | "orange" | "red";
  sub?: string;
}) {
  const colors = {
    neutral: "text-[#191919]",
    green: "text-emerald-600",
    orange: "text-[#FF5C00]",
    red: "text-red-600",
  };
  return (
    <div className="flex flex-col">
      <p className="text-xs text-[#9a9a9a] uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${colors[color]}`}>{value.toLocaleString()}</p>
      {sub && <p className="text-[11px] text-[#9a9a9a] mt-0.5">{sub}</p>}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-[#9a9a9a]">{label}:</span>
      <span className="text-[11px] font-medium text-[#626262]">{value}</span>
    </div>
  );
}
