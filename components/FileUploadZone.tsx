"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";

type Props = {
  label: string;
  description: string;
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
  disabled?: boolean;
};

export default function FileUploadZone({ label, description, file, onFile, onClear, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  function showDropError(msg: string) {
    setDropError(msg);
    setTimeout(() => setDropError(null), 2500);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      showDropError("Only .csv files are supported.");
      return;
    }
    onFile(f);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onFile(f);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#626262]">{label}</p>
          <p className="text-[11px] text-[#9a9a9a] mt-0.5">{description}</p>
        </div>
        {file && (
          <button
            onClick={onClear}
            className="text-[11px] text-[#9a9a9a] hover:text-[#191919] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-[#E1E1E1] bg-white px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#191919]">{file.name}</p>
            <p className="text-[11px] text-[#9a9a9a]">{file.size > 0 ? `${(file.size / 1024).toFixed(1)} KB` : "sample"}</p>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-all cursor-pointer
            ${dropError ? "border-red-300 bg-red-50" : dragging ? "border-[#FF5C00] bg-[#FFDACC]/30" : "border-[#E1E1E1] bg-white hover:border-[#FF5C00]/50 hover:bg-[#FFDACC]/10"}
            ${disabled ? "pointer-events-none opacity-40" : ""}
          `}
        >
          {dropError ? (
            <>
              <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-red-500 font-medium">{dropError}</p>
            </>
          ) : (
            <>
              <svg className="h-8 w-8 text-[#C0C0C0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <div>
                <p className="text-sm text-[#626262]">Drop CSV here or <span className="text-[#FF5C00] underline underline-offset-2">browse</span></p>
                <p className="text-[11px] text-[#9a9a9a] mt-1">.csv files only</p>
              </div>
            </>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
    </div>
  );
}
