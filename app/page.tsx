"use client";

import { useState } from "react";
import FileUploadZone from "@/components/FileUploadZone";
import SummaryBar from "@/components/SummaryBar";
import ResultsTable from "@/components/ResultsTable";
import ExportButton from "@/components/ExportButton";
import { parseCSVFile, parseCSVFromURL } from "@/lib/csv";
import { reconcile, detectKeyColumn, ReconciliationResult } from "@/lib/reconcile";

type Status = "idle" | "loading" | "done" | "error";

export default function Home() {
  const [vendorFile, setVendorFile] = useState<File | null>(null);
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [keyColumn, setKeyColumn] = useState<string>("CUSIP");
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReconciliationResult | null>(null);

  async function handleVendorFile(f: File) {
    setVendorFile(f);
    setResult(null);
    try {
      const parsed = await parseCSVFile(f);
      const detected = detectKeyColumn(parsed.headers);
      setKeyColumn(detected);
      setAvailableColumns(parsed.headers);
    } catch {}
  }

  async function handleInternalFile(f: File) {
    setInternalFile(f);
    setResult(null);
  }

  async function handleLoadSample() {
    setStatus("loading");
    setError(null);
    setResult(null);
    try {
      const [v, i] = await Promise.all([
        parseCSVFromURL("/sample/vendor_holdings.csv"),
        parseCSVFromURL("/sample/internal_record.csv"),
      ]);
      const vFile = new File([""], "vendor_holdings.csv");
      const iFile = new File([""], "internal_record.csv");
      setVendorFile(vFile);
      setInternalFile(iFile);
      setAvailableColumns(v.headers);
      const detectedKey = detectKeyColumn(v.headers);
      setKeyColumn(detectedKey);
      const r = reconcile(v.rows, i.rows, detectedKey, "vendor_holdings.csv", "internal_record.csv");
      setResult(r);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sample data.");
      setStatus("error");
    }
  }

  async function handleReconcile() {
    if (!vendorFile || !internalFile) return;
    setStatus("loading");
    setError(null);
    setResult(null);
    try {
      const [v, i] = await Promise.all([
        parseCSVFile(vendorFile),
        parseCSVFile(internalFile),
      ]);
      if (!v.headers.includes(keyColumn)) {
        throw new Error(`Key column "${keyColumn}" not found in vendor file. Available: ${v.headers.join(", ")}`);
      }
      if (!i.headers.includes(keyColumn)) {
        throw new Error(`Key column "${keyColumn}" not found in internal file. Available: ${i.headers.join(", ")}`);
      }
      const r = reconcile(v.rows, i.rows, keyColumn, vendorFile.name, internalFile.name);
      setResult(r);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reconciliation failed.");
      setStatus("error");
    }
  }

  const bothLoaded = vendorFile !== null && internalFile !== null;

  return (
    <div className="min-h-screen px-4 py-10 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-2 w-2 rounded-full bg-[#FF5C00]" />
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9a9a9a]">Fund Operations</p>
            </div>
            <h1 className="text-2xl font-bold text-[#191919]">Holdings Reconciliation</h1>
            <p className="mt-1 text-sm text-[#626262] max-w-xl">
              Compare a custodian or fund-admin vendor file against your internal book of record. Surfaces per-field discrepancies, unmatched positions, and exports a clean exceptions report.
            </p>
          </div>
          <button
            onClick={handleLoadSample}
            disabled={status === "loading"}
            className="flex items-center gap-2 rounded-lg bg-[#FF5C00] hover:bg-[#CC4A00] disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
            </svg>
            Load Sample Data
          </button>
        </div>
      </header>

      {/* File upload + key column row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
        <FileUploadZone
          label="Vendor File"
          description="Custodian or fund-admin holdings report"
          file={vendorFile}
          onFile={handleVendorFile}
          onClear={() => { setVendorFile(null); setResult(null); }}
          disabled={status === "loading"}
        />
        <FileUploadZone
          label="Internal Record"
          description="Internal book of record / shadow NAV"
          file={internalFile}
          onFile={handleInternalFile}
          onClear={() => { setInternalFile(null); setResult(null); }}
          disabled={status === "loading"}
        />
      </div>

      {/* Key column + reconcile */}
      {bothLoaded && status !== "done" && (
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label htmlFor="key-col" className="text-xs font-semibold uppercase tracking-widest text-[#9a9a9a] whitespace-nowrap">
              Key Column
            </label>
            {availableColumns.length > 0 ? (
              <select
                id="key-col"
                value={keyColumn}
                onChange={(e) => setKeyColumn(e.target.value)}
                className="rounded-lg border border-[#E1E1E1] bg-white px-3 py-1.5 text-sm text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#FF5C00]"
              >
                {availableColumns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input
                id="key-col"
                value={keyColumn}
                onChange={(e) => setKeyColumn(e.target.value)}
                className="w-32 rounded-lg border border-[#E1E1E1] bg-white px-3 py-1.5 text-sm text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#FF5C00]"
              />
            )}
          </div>
          <button
            onClick={handleReconcile}
            disabled={status === "loading"}
            className="flex items-center gap-2 rounded-lg bg-[#FF5C00] hover:bg-[#CC4A00] disabled:opacity-50 px-5 py-2 text-sm font-medium text-white transition-colors"
          >
            {status === "loading" ? (
              <>
                <Spinner />
                Reconciling…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Run Reconciliation
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading */}
      {status === "loading" && !result && (
        <div className="flex items-center justify-center py-24 gap-3 text-[#9a9a9a]">
          <Spinner />
          <span className="text-sm">Parsing and reconciling…</span>
        </div>
      )}

      {/* Error */}
      {status === "error" && error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-6">
          <SummaryBar result={result} />

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-sm font-semibold text-[#9a9a9a] uppercase tracking-widest">Reconciliation Detail</h2>
            <div className="flex items-center gap-3">
              <ExportButton result={result} />
              <button
                onClick={() => { setResult(null); setVendorFile(null); setInternalFile(null); setStatus("idle"); setError(null); }}
                className="text-xs text-[#9a9a9a] hover:text-[#191919] transition-colors"
              >
                New reconciliation
              </button>
            </div>
          </div>

          <ResultsTable rows={result.rows} />
        </div>
      )}

      {/* Empty state */}
      {status === "idle" && !bothLoaded && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="rounded-full border border-[#E1E1E1] bg-white p-5">
            <svg className="h-10 w-10 text-[#C0C0C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-[#191919]">No files loaded</p>
            <p className="text-sm text-[#9a9a9a] mt-1 max-w-sm">
              Upload a vendor file and internal record above, or click <strong className="text-[#FF5C00]">Load Sample Data</strong> to see a demo reconciliation instantly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
