import * as XLSX from "xlsx";
import { resolveCode } from "./dreMapping.js";

// Matches account codes like "01.01", "04.02.06.02", "01.04.01.01." (trailing dot allowed),
// at the start of a cell's text (so "01.01 - Receita" or "01.01 Receita" both work).
const CODE_RE = /^(\d{2}(?:\.\d{2}){1,4})\.?(?:\s|$|[-–—:.])/;

function extractCode(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const m = trimmed.match(CODE_RE);
  return m ? m[1] : null;
}

function isLikelyMoneyValue(v) {
  if (typeof v !== "number" || !isFinite(v)) return false;
  if (v === 0) return false;
  // Values between -1 and 1 (exclusive) are almost certainly a % column, not R$.
  return Math.abs(v) >= 1;
}

// Given a worksheet (array-of-arrays form) and the row index where a code was found,
// pick the most plausible R$ value in that row: the numeric cell with the largest
// absolute value, preferring the rightmost on ties.
function pickValueFromRow(row) {
  let best = null;
  for (let c = 0; c < row.length; c++) {
    const v = row[c];
    if (isLikelyMoneyValue(v)) {
      if (best === null || Math.abs(v) >= Math.abs(best)) {
        best = v;
      }
    }
  }
  return best;
}

/**
 * Parses an uploaded workbook (any layout) into a list of { code, value, sheet, row }.
 */
export function extractCodedRows(workbook) {
  const found = [];
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
    rows.forEach((row, rIdx) => {
      for (let c = 0; c < row.length; c++) {
        const code = extractCode(row[c]);
        if (code) {
          const value = pickValueFromRow(row);
          if (value !== null) {
            found.push({ code, value, sheet: sheetName, row: rIdx + 1 });
          }
          break; // one code per row is enough
        }
      }
    });
  });
  return found;
}

/**
 * Matches extracted (code, value) pairs against the known DRE mapping.
 * Returns { matched: [...], unmatched: [...], byLine: { lineId: sum } }
 */
export function reconcile(codedRows) {
  const matched = [];
  const unmatched = [];
  const byLine = {};

  codedRows.forEach((entry) => {
    const resolved = resolveCode(entry.code);
    if (resolved) {
      matched.push({ ...entry, ...resolved });
      byLine[resolved.lineId] = (byLine[resolved.lineId] || 0) + entry.value;
    } else {
      unmatched.push(entry);
    }
  });

  return { matched, unmatched, byLine };
}

export async function parseDreFile(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const codedRows = extractCodedRows(wb);
  return reconcile(codedRows);
}
