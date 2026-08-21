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

function looksLikeCurrency(val: string): boolean {
  return /^\$?[\d,]+(\.\d{2})?$/.test(val.trim()) && parseFloat(val.replace(/[$,]/g, "")) > 999;
}

function looksLikePrice(val: string): boolean {
  return /^\$?[\d,]+\.\d{2,4}$/.test(val.trim());
}

export function formatValue(val: string): string {
  if (!val) return "—";
  const cleaned = val.replace(/[$,]/g, "").trim();
  const n = parseFloat(cleaned);
  if (isNaN(n)) return val;
  if (looksLikeCurrency(val)) return usd.format(n);
  if (looksLikePrice(val)) return `$${num.format(n)}`;
  return num.format(n);
}

export function formatDelta(delta: number | null, vendorValue: string): string {
  if (delta === null) return "";
  const cleaned = vendorValue.replace(/[$,]/g, "").trim();
  const n = parseFloat(cleaned);
  const isMonetary = !isNaN(n) && (looksLikeCurrency(vendorValue) || looksLikePrice(vendorValue));
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
