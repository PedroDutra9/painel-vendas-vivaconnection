import * as XLSX from "xlsx";
import { resolveByName, shouldSkipRow } from "./dreNameMapping.js";

function parseValorBR(v) {
  if (v === undefined || v === null || v === "") return 0;
  if (typeof v === "number") return v;
  const cleaned = String(v).trim().replace(/^R\$\s*/i, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function findCol(headers, ...names) {
  for (const name of names) {
    const idx = headers.findIndex((h) => String(h || "").trim().toLowerCase() === name);
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Parses the monthly "demonstrativo financeiro" file: descricao / valor / valor_total.
 * Only rows WITHOUT a valor_total are real data points (rows with one are group
 * headers / subtotals of the rows below them, and would double-count if summed too).
 */
export function extractNamedRows(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
  if (!rows.length) return [];

  const headers = rows[0].map((h) => String(h || "").trim().toLowerCase());
  let descCol = findCol(headers, "descricao", "descrição");
  let valorCol = findCol(headers, "valor");
  let totalCol = findCol(headers, "valor_total", "valor total");
  if (descCol === -1) descCol = 0;
  if (valorCol === -1) valorCol = 1;
  if (totalCol === -1) totalCol = 2;

  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.length) continue;
    const descricao = row[descCol];
    if (!descricao || shouldSkipRow(descricao)) continue;
    const hasTotal = totalCol !== -1 && row[totalCol] !== undefined && String(row[totalCol]).trim() !== "";
    if (hasTotal) continue; // group header / subtotal row, skip to avoid double counting
    const value = parseValorBR(row[valorCol]);
    out.push({ descricao: String(descricao).trim(), value });
  }
  return out;
}

export function reconcileByName(namedRows) {
  const matched = [];
  const unmatched = [];
  const excluded = [];
  const byLine = {};

  namedRows.forEach((entry) => {
    const resolved = resolveByName(entry.descricao);
    if (resolved && resolved.lineId) {
      matched.push({ ...entry, lineId: resolved.lineId });
      byLine[resolved.lineId] = (byLine[resolved.lineId] || 0) + entry.value;
    } else if (resolved && resolved.excluded) {
      excluded.push(entry);
    } else {
      unmatched.push(entry);
    }
  });

  return { matched, unmatched, excluded, byLine };
}

export async function parseDreFileByName(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const namedRows = extractNamedRows(wb);
  return reconcileByName(namedRows);
}
