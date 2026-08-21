const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

// Only treat as currency if the value has an explicit $ sign OR has exactly 2
// decimal places (market values, prices). Bare integers like share counts are
// left as plain numbers.
function looksLikeCurrency(val: string): boolean {
  const trimmed = val.trim();
  return trimmed.startsWith("$") || /^\d[\d,]*\.\d{2}$/.test(trimmed);
}

export function formatValue(val: string): string {
  if (!val) return "—";
  const cleaned = val.replace(/[$,]/g, "").trim();
  const n = parseFloat(cleaned);
  if (isNaN(n)) return val;
  if (looksLikeCurrency(val)) return usd.format(n);
  return num.format(n);
}

export function formatDelta(delta: number | null, vendorValue: string): string {
  if (delta === null) return "";
  const isMonetary = looksLikeCurrency(vendorValue);
  const sign = delta > 0 ? "+" : "";
  if (isMonetary) return `${sign}${usd.format(delta)}`;
  return `${sign}${num.format(delta)}`;
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
