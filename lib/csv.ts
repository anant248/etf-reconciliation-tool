import Papa from "papaparse";

export type ParsedCSV = {
  headers: string[];
  rows: Record<string, string>[];
};

export function parseCSVFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      transform: (val) => val.trim(),
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(results.errors[0].message));
          return;
        }
        const headers = results.meta.fields ?? [];
        resolve({ headers, rows: results.data });
      },
      error: (err) => reject(new Error(err.message)),
    });
  });
}

export async function parseCSVFromURL(url: string): Promise<ParsedCSV> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch sample data: ${res.statusText}`);
  const text = await res.text();
  const blob = new Blob([text], { type: "text/csv" });
  const file = new File([blob], url.split("/").pop() ?? "sample.csv");
  return parseCSVFile(file);
}
