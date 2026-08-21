"use client";

import { useState, useMemo } from "react";
import { ReconciliationRow } from "@/lib/reconcile";
import { formatValue, formatDelta } from "@/lib/format";

type Tab = "exceptions" | "mismatched" | "unmatched" | "matched";

type Props = { rows: ReconciliationRow[] };

export default function ResultsTable({ rows }: Props) {
  const [tab, setTab] = useState<Tab>("exceptions");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const mismatched = rows.filter((r) => r.status === "mismatched");
  const unmatched = rows.filter((r) => r.status === "unmatched");
  const matched = rows.filter((r) => r.status === "matched");

  const tabs: { id: Tab; label: string; count: number; badge: "orange" | "red" | "green" }[] = [
    { id: "exceptions", label: "Exceptions", count: mismatched.length + unmatched.length, badge: "orange" },
    { id: "mismatched", label: "Mismatched", count: mismatched.length, badge: "orange" },
    { id: "unmatched", label: "Unmatched", count: unmatched.length, badge: "red" },
    { id: "matched", label: "Matched", count: matched.length, badge: "green" },
  ];

  function toggleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  return (
    <div className="rounded-xl border border-[#E1E1E1] bg-white overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[#E1E1E1] bg-[#f6f6f6]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? "border-[#FF5C00] text-[#191919]"
                : "border-transparent text-[#626262] hover:text-[#191919]"
            }`}
          >
            {t.label}
            <Badge count={t.count} color={t.badge} />
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        {(tab === "exceptions" || tab === "mismatched") && (
          <MismatchedTable
            rows={mismatched}
            showUnmatched={tab === "exceptions"}
            unmatchedRows={unmatched}
            sortField={sortField}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        )}
        {tab === "unmatched" && <UnmatchedTable rows={unmatched} />}
        {tab === "matched" && <MatchedTable rows={matched} />}
      </div>
    </div>
  );
}

function MismatchedTable({
  rows,
  showUnmatched,
  unmatchedRows,
  sortField,
  sortDir,
  onSort,
}: {
  rows: ReconciliationRow[];
  showUnmatched: boolean;
  unmatchedRows: ReconciliationRow[];
  sortField: string | null;
  sortDir: "asc" | "desc";
  onSort: (f: string) => void;
}) {
  const flatDiffs = useMemo(() => {
    const items: {
      key: string;
      security: string;
      field: string;
      vendorValue: string;
      internalValue: string;
      delta: number | null;
    }[] = [];

    for (const r of rows) {
      const security = r.vendorRow?.["Security Name"] ?? r.vendorRow?.["Ticker"] ?? r.internalRow?.["Security Name"] ?? r.internalRow?.["Ticker"] ?? "";
      for (const d of r.diffs ?? []) {
        items.push({ key: r.key, security, ...d });
      }
    }

    if (sortField === "delta") {
      items.sort((a, b) => {
        const aAbs = a.delta !== null ? Math.abs(a.delta) : -Infinity;
        const bAbs = b.delta !== null ? Math.abs(b.delta) : -Infinity;
        return sortDir === "desc" ? bAbs - aAbs : aAbs - bAbs;
      });
    }

    return items;
  }, [rows, sortField, sortDir]);

  if (flatDiffs.length === 0 && (!showUnmatched || unmatchedRows.length === 0)) {
    return <EmptyState message="No mismatched positions found." />;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[#E1E1E1] bg-[#f6f6f6]">
          <Th>CUSIP</Th>
          <Th>Security</Th>
          <Th>Field</Th>
          <Th>Vendor Value</Th>
          <Th>Internal Value</Th>
          <Th sortable sortDir={sortField === "delta" ? sortDir : null} onSort={() => onSort("delta")}>
            Delta
          </Th>
        </tr>
      </thead>
      <tbody>
        {flatDiffs.map((d, i) => (
          <tr key={i} className="border-b border-[#E1E1E1] hover:bg-[#f6f6f6] transition-colors">
            <Td mono>{d.key}</Td>
            <Td>{d.security}</Td>
            <Td>
              <span className="rounded bg-[#FFDACC] px-1.5 py-0.5 text-xs font-medium text-[#CC4A00]">
                {d.field}
              </span>
            </Td>
            <Td mono>{formatValue(d.vendorValue)}</Td>
            <Td mono>{formatValue(d.internalValue)}</Td>
            <Td mono>
              {d.delta !== null ? (
                <span className={d.delta > 0 ? "text-emerald-600" : "text-red-600"}>
                  {formatDelta(d.delta, d.vendorValue)}
                </span>
              ) : (
                <span className="text-[#C0C0C0]">—</span>
              )}
            </Td>
          </tr>
        ))}

        {showUnmatched && unmatchedRows.length > 0 && (
          <>
            <tr className="border-b border-[#E1E1E1] bg-[#f6f6f6]">
              <td colSpan={6} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-[#9a9a9a]">
                Unmatched Positions
              </td>
            </tr>
            {unmatchedRows.map((r) => {
              const row = r.vendorRow ?? r.internalRow ?? {};
              return (
                <tr key={r.key} className="border-b border-[#E1E1E1] hover:bg-[#f6f6f6] transition-colors">
                  <Td mono>{r.key}</Td>
                  <Td>{row["Security Name"] ?? "—"}</Td>
                  <Td>
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      r.side === "vendor_only"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {r.side === "vendor_only" ? "Vendor only" : "Internal only"}
                    </span>
                  </Td>
                  <Td colSpan={3}>
                    <span className="text-[#9a9a9a] text-xs">
                      {row["Shares"] ?? "?"} shares · {formatValue(row["Market Value"] ?? "")}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </>
        )}
      </tbody>
    </table>
  );
}

function UnmatchedTable({ rows }: { rows: ReconciliationRow[] }) {
  if (rows.length === 0) return <EmptyState message="No unmatched positions found." />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[#E1E1E1] bg-[#f6f6f6]">
          <Th>CUSIP</Th>
          <Th>Ticker</Th>
          <Th>Security Name</Th>
          <Th>Missing From</Th>
          <Th>Shares</Th>
          <Th>Price</Th>
          <Th>Market Value</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const row = r.vendorRow ?? r.internalRow ?? {};
          const isVendorOnly = r.side === "vendor_only";
          return (
            <tr key={r.key} className="border-b border-[#E1E1E1] hover:bg-[#f6f6f6] transition-colors">
              <Td mono>{r.key}</Td>
              <Td>{row["Ticker"] ?? "—"}</Td>
              <Td>{row["Security Name"] ?? "—"}</Td>
              <Td>
                <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                  isVendorOnly ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                }`}>
                  {isVendorOnly ? "Internal record" : "Vendor file"}
                </span>
              </Td>
              <Td mono>{row["Shares"] ? Number(row["Shares"]).toLocaleString() : "—"}</Td>
              <Td mono>{formatValue(row["Price"] ?? "")}</Td>
              <Td mono>{formatValue(row["Market Value"] ?? "")}</Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function MatchedTable({ rows }: { rows: ReconciliationRow[] }) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) return <EmptyState message="No matched positions." />;

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E1E1E1]">
        <p className="text-sm text-[#626262]">
          <span className="font-semibold text-emerald-600">{rows.length}</span> positions match exactly across both files.
        </p>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs text-[#9a9a9a] hover:text-[#191919] transition-colors"
        >
          {expanded ? "Collapse" : "Show all"}
        </button>
      </div>
      {expanded && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E1E1E1] bg-[#f6f6f6]">
              <Th>CUSIP</Th>
              <Th>Ticker</Th>
              <Th>Security Name</Th>
              <Th>Shares</Th>
              <Th>Price</Th>
              <Th>Market Value</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const row = r.vendorRow ?? {};
              return (
                <tr key={r.key} className="border-b border-[#E1E1E1] hover:bg-[#f6f6f6] transition-colors">
                  <Td mono>{r.key}</Td>
                  <Td>{row["Ticker"] ?? "—"}</Td>
                  <Td>{row["Security Name"] ?? "—"}</Td>
                  <Td mono>{row["Shares"] ? Number(row["Shares"]).toLocaleString() : "—"}</Td>
                  <Td mono>{formatValue(row["Price"] ?? "")}</Td>
                  <Td mono>{formatValue(row["Market Value"] ?? "")}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Primitives ──────────────────────────────────────────────────────────────

function Th({
  children,
  sortable,
  sortDir,
  onSort,
}: {
  children: React.ReactNode;
  sortable?: boolean;
  sortDir?: "asc" | "desc" | null;
  onSort?: () => void;
}) {
  return (
    <th
      onClick={sortable ? onSort : undefined}
      className={`px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-[#9a9a9a] whitespace-nowrap ${
        sortable ? "cursor-pointer select-none hover:text-[#191919]" : ""
      }`}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span className="text-[#C0C0C0]">
            {sortDir === "desc" ? "↓" : sortDir === "asc" ? "↑" : "↕"}
          </span>
        )}
      </span>
    </th>
  );
}

function Td({
  children,
  mono,
  colSpan,
}: {
  children: React.ReactNode;
  mono?: boolean;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`px-4 py-2.5 text-[#191919] whitespace-nowrap ${mono ? "font-mono text-xs" : "text-sm"}`}
    >
      {children}
    </td>
  );
}

function Badge({ count, color }: { count: number; color: "orange" | "red" | "green" }) {
  if (count === 0) return <span className="text-xs text-[#C0C0C0]">0</span>;
  const styles = {
    orange: "bg-[#FFDACC] text-[#CC4A00]",
    red: "bg-red-100 text-red-700",
    green: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles[color]}`}>
      {count}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-[#9a9a9a]">{message}</div>
  );
}
