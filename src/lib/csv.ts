import type { RiskLevel } from "./api";

export function parseCsv(text: string): string[][] {
  const src = text.replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function cleanCell(cell: string): string {
  return cell.replace(/\s+/g, " ").trim();
}

export function riskFromCell(
  cell: string,
): { risk: RiskLevel; note: string } | null {
  const text = cleanCell(cell);
  if (!text) return null;

  let risk: RiskLevel | null = null;
  if (text.includes("🟢")) risk = "ALLOWED";
  else if (text.includes("🟡")) risk = "CAUTION";
  else if (text.includes("🔴")) risk = "FORBIDDEN";
  else if (/^\s*(нет|нельзя)/i.test(text)) risk = "FORBIDDEN";
  else if (/осторож/i.test(text)) risk = "CAUTION";
  else if (/можно/i.test(text)) risk = "ALLOWED";
  if (!risk) return null;

  const note = text.replace(/[🟢🟡🔴]/g, "").replace(/\s+/g, " ").trim();
  return { risk, note };
}
