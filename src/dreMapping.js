// Mapping between "Plano de Contas" account codes and DRE Gerencial lines.
// Extracted directly from the formulas in the client's own workbook
// (each DRE line originally pulled from a specific row of "Plano de Contas - MATRIZ 2026";
// this table replaces "that row" with "that row's account code", so it works regardless
// of the exact layout of whatever file is uploaded each month — as long as the account
// codes (01.01, 02.01, 04.02.06.02, etc.) are present somewhere in the row.
//
// A few lines in the original file weren't linked to any account (they were always 0):
// "Devoluções e Abatimentos da Receita", "Material para Revenda" and "Receitas Financeiras".
// Those are kept in the structure below with an empty code list, editable by hand if needed.
//
// Two lines in the client's own file (09.02 Financiamentos, 09.03 Parcelamentos) point to
// accounts whose labels ("Taxa de TED/DOC", "Juros e encargos") don't quite match the DRE
// line name — that's inherited as-is from their spreadsheet, not something this tool changed.

export const DRE_GROUPS = [
  {
    id: "g1", num: "1", label: "RECEITAS", sign: 1,
    lines: [
      { id: "01.01", label: "Receita Operacional Bruta", codes: ["01.04.01.01", "01.04.02", "01.04.03", "01.04.04"] },
    ],
  },
  {
    id: "g2", num: "2", label: "DEDUÇÕES E ABATIMENTOS", sign: -1,
    lines: [
      { id: "02.01", label: "Devoluções e Abatimentos da Receita", codes: [] },
    ],
  },
  {
    id: "g3", num: "3", label: "IMPOSTOS", sign: -1,
    lines: [
      { id: "03.01", label: "Impostos", codes: ["02.01"] },
    ],
  },
  {
    id: "g4", num: "4", label: "CUSTOS VARIÁVEIS", sign: -1,
    lines: [
      { id: "04.01", label: "Interconexão - Link", codes: ["03.01"] },
      { id: "04.02", label: "Conteúdo de Terceiros", codes: ["04.04.01"] },
      { id: "04.03", label: "Despesas com Boletos", codes: ["04.02.06.02"] },
    ],
  },
  {
    id: "g5", num: "5", label: "CUSTOS FIXOS", sign: -1,
    lines: [
      { id: "05.01", label: "Despesas com Recursos Humanos", codes: ["04.01.01", "04.01.04"] },
      { id: "05.02", label: "Despesas Comerciais", codes: ["04.01.01.08"] },
      { id: "05.03", label: "Despesas Administrativas", codes: ["04.02.01", "04.02.02", "04.02.03", "04.02.09", "04.02.11"] },
      { id: "05.04", label: "Despesas Financeiras (Bancos)", codes: ["04.02.06.01"] },
      { id: "05.05", label: "Marketing", codes: ["04.03"] },
      { id: "05.06", label: "Taxas e Impostos", codes: ["04.02.10"] },
      { id: "05.07", label: "Pro-Labore", codes: ["04.01.03.01"] },
      { id: "05.08", label: "Serviços de Terceiros", codes: ["04.02.07"] },
    ],
  },
  {
    id: "g6", num: "6", label: "DESPESAS OPERACIONAIS", sign: -1,
    lines: [
      { id: "06.01", label: "Compartilhamento de Poste, Locação de Torre / POP / Faixa de Domínio", codes: ["04.02.05.03", "04.02.05.02"] },
      { id: "06.02", label: "Manutenções", codes: ["04.05"] },
      { id: "06.03", label: "Frota / Deslocamentos", codes: ["04.02.04"] },
      { id: "06.04", label: "Outras Despesas Operacionais", codes: ["04.02.05.01"] },
    ],
  },
  {
    id: "g7", num: "7", label: "MATERIAL PARA REVENDA", sign: -1,
    lines: [
      { id: "07.01", label: "Material para Revenda", codes: [] },
    ],
  },
  {
    id: "g8", num: "8", label: "INVESTIMENTOS", sign: -1,
    lines: [
      { id: "08.01", label: "Aquisições", codes: ["05.01"] },
      { id: "08.02", label: "Infraestrutura", codes: ["05.02"] },
      { id: "08.03", label: "Ativo Fixo", codes: ["05.03.01", "05.04.01"] },
      { id: "08.04", label: "Construções", codes: ["05.05.01"] },
    ],
  },
  {
    id: "g9", num: "9", label: "EMPRÉSTIMOS / FINANCIAMENTO / PARCELAMENTOS", sign: -1,
    lines: [
      { id: "09.01", label: "Empréstimos", codes: ["04.02.06.04"] },
      { id: "09.02", label: "Financiamentos", codes: ["04.02.06.05"] },
      { id: "09.03", label: "Parcelamentos", codes: ["04.02.06.06"] },
    ],
  },
  {
    id: "g10", num: "10", label: "RECEITAS FINANCEIRAS", sign: 1,
    lines: [
      { id: "10.01", label: "Receitas Financeiras", codes: [] },
    ],
  },
  {
    id: "g11", num: "11", label: "RETIRADA DOS SÓCIOS E DISTRIBUIÇÃO DE LUCROS", sign: -1,
    lines: [
      { id: "11.01", label: "Retirada dos Sócios e Distribuição de Lucros", codes: ["04.01.03.02"] },
    ],
  },
];

// Subtotal definitions: which groups (by id) roll into each subtotal, in order of appearance.
export const SUBTOTALS = [
  { id: "margem", label: "Margem de Contribuição", afterGroup: "g4", groups: ["g1", "g2", "g3", "g4"] },
  { id: "resop", label: "Resultado Operacional", afterGroup: "g7", groups: ["g1", "g2", "g3", "g4", "g5", "g6", "g7"] },
  { id: "resliqop", label: "Resultado Líquido Operacional", afterGroup: "g9", groups: ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9"] },
  { id: "resliqfin", label: "Resultado Líquido Financeiro Após Distribuição de Lucros e Dividendos", afterGroup: "g11", groups: ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g10", "g11"] },
];

// Flat code -> { groupId, lineId, sign } index, built once.
export const CODE_INDEX = (() => {
  const idx = {};
  DRE_GROUPS.forEach((g) => {
    g.lines.forEach((line) => {
      line.codes.forEach((code) => {
        idx[code] = { groupId: g.id, lineId: line.id, sign: g.sign };
      });
    });
  });
  return idx;
})();

export const ALL_KNOWN_CODES = Object.keys(CODE_INDEX).sort((a, b) => b.length - a.length);

// Resolve an arbitrary account code from an uploaded file to a DRE line, using an
// exact match first and falling back to the longest known code that is a prefix of it
// (so a deeper leaf account rolls up into whichever level the client's own DRE links to).
export function resolveCode(code) {
  if (CODE_INDEX[code]) return CODE_INDEX[code];
  for (const known of ALL_KNOWN_CODES) {
    if (code.startsWith(known + ".") || code === known) {
      return CODE_INDEX[known];
    }
  }
  return null;
}
