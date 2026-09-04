// Maps category names from the monthly "demonstrativo financeiro" report (the file
// you actually upload each month) to DRE lines (defined in dreMapping.js, whose
// structure mirrors the original DRE Gerencial workbook).
//
// The monthly report has 3 columns: descricao, valor, valor_total. Rows with a
// valor_total are group headers (their total is just the sum of the rows below —
// summing them too would double count), so only rows WITHOUT a valor_total are
// used as the actual data points, matched here by their category name.
//
// A few placements were judgment calls, called out inline — tell me if any should
// move to a different DRE line.

function norm(s) {
  return String(s || "")
    .trim()
    .toUpperCase()
    .replace(/[º°]/g, "O")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // strip accents so "ÁGUA"/"AGUA" both match
}

const RAW_MAP = {
  // --- Receitas ---
  "TAXAS DE INSTALACOES": "01.01",
  "VENDAS PRODUTOS USADOS": "01.01",
  "VISITA TECNICA": "01.01",
  "01.PLANOS E SERVICOS": "01.01",
  "JUROS MULTAS DE CLIENTES": "10.01",
  "RENEGOCIACAO DE DIVIDAS": "10.01",

  // --- Despesas com escritório -> Despesas Administrativas (05.03), except: ---
  "AGUA": "05.03",
  "ALUGUEL DE IMOVEIS": "05.03",
  "ASSOCIACOES ( APIMS/REDETELESUL/COMERICAL)": "05.03",
  "CARTORIO": "05.03",
  "CONSULTORIA E TREINAMENTOS": "05.03",
  "CONTABILIDADE": "05.03",
  "CORREIOS": "05.03",
  "DOACOES": "05.03",
  "EMPRESA ZELADORA (SEGURANCA/LIMPEZA)": "05.03",
  "ENDOMARKETING": "05.03",
  "ENERGIA ELETRICA": "05.03",
  "HOSPEDAGEM DE SITE": "05.03",
  "JURIDICO": "05.03",
  "MATERIAL DE LIMPEZA": "05.03",
  "PAPELARIA E SUPRIMENTOS": "05.03",
  "PASSAGEM AEREA": "05.03",
  "SISTEMA DE GERENCIAMENTO": "05.03",
  "SUPERMERCADOS (CAFE/ACUCAR/BISCOITOS, ETC)": "05.03",
  "TELEFONE CELULAR": "05.03",
  "TELEFONE FIXO/PABX": "05.03",
  "PLANO DE SAUDE - SOCIOS": "05.03", // judgment call: could be RH (05.01) instead
  "PRO-LABORE": "05.07",
  "RETIRADA DOS SOCIOS": "11.01",

  // --- Despesas com RH -> 05.01 ---
  "13o SALARIO": "05.01",
  "CARTAO BENEFICIOS DO COLABORADOR": "05.01",
  "CURSOS/TREINAMENTOS": "05.01",
  "DESPESAS COM CONSULTA MEDICA": "05.01",
  "DESPESAS COM DIARIAS": "05.01",
  "DESPESAS COM FARMACIA": "05.01",
  "DESPESAS COM REFEICOES": "05.01",
  "DESPESAS COM UNIFORME": "05.01",
  "EXAMES ADMISSIONAL/DEMISSIONAL/PERIODICO": "05.01",
  "FERIAS DOS COLABORADORES": "05.01",
  "FGTS/GFIT": "05.01",
  "FOLHA DE PAGAMENTO": "05.01",
  "HORAS EXTRAS": "05.01",
  "HOTEL": "05.01",
  "INSS/GRPS": "05.01",
  "RECISAO COM TRABALHADOER": "05.01",
  "SEGURANCA NO TRABALHO/SAUDE": "05.01",
  "SEGURO DE VIDA COLABORADOR": "05.01",

  // --- Manutenção e benfeitorias -> Construções (08.04) ---
  "CONSTRUCAO DEPOSITO 04/26": "08.04",
  "MANUTENCAO/ CONSERVACAO PREDIAL": "08.04",
  "REFORMAS E BENFEITORIAS": "08.04",

  // --- Despesas operacionais ---
  "-- ALUGUEL DE VEICULOS": "06.03",
  "-- DESPESAS COM COMBUSTIVEL": "06.03",
  "-- LAVAGEM DE VEICULOS": "06.03",
  "-- MANUTENCAO DE VEICULOS": "06.03",
  "-- MULTAS DE TRANSITO": "06.03",
  "-- TAXAS DE LICENCIAMENTO / IPVA /TRANSFERENCIA": "06.03",
  "SEGUROS DA FROTA": "06.03",
  "ALUGUEL TORRES": "06.01",
  "POSTEAMENTO": "06.01",
  "CONSULORIA TECNICA (ENGENHARIA)": "06.04",
  "EPI.S": "06.04",
  "FRETES": "06.04",
  "MANUTENCAO DE REDE": "06.04",
  "MITIGACAO": "06.04",

  // --- Despesas comerciais -> 05.02 ---
  "COMISSAO DE VENDAS": "05.02",

  // --- Despesas financeiras -> 05.04 ---
  "IOF. BANCARIO": "05.04",
  "JUROS E ENCARGOS": "05.04", // judgment call: could relate to 09.xx loans instead
  "TARIFAS BANCARIAS (MANUTENCAO CONTA)": "05.04",
  "TARIFAS BOLETOS/COBRANCAS": "05.04",
  "TAXA ADM. CARTOES": "05.04",

  // --- Impostos e deduções sobre vendas ---
  "DEDUCOES OU ABATIMENTOS DE VENDAS": "02.01",
  "ICMS": "03.01",
  "ISS": "03.01",
  "PIS/COFINS": "03.01",
  "SIMPLES NACIONAL": "03.01",
  "ST- SUBSITITUICAO TRIBUTARIA": "03.01",

  // --- Investimentos e aquisições ---
  "AQUISICAO DE IMOVEIS": "08.01",
  "AQUISICAO DE MAQUINAS E EQUIPAMENTOS": "08.01",
  "AQUISICAO DE MOBILIARIO": "08.01",
  "AQUISICAO DE VEICULOS": "08.01",
  "SERVIDORES/COMPUTADORES": "08.01",
  "CONSTRUCAO DE REDE (MATERIAS E EQUIPAMENTOS)": "08.02",
  "EQUIPAMENTOS CAMERAS E ACESSORIOS": "08.03",
  "MATERIAIS E EQUIP.P/ INSTALACAO DE CLIENTES": "08.03",

  // --- Empréstimos e financiamentos ---
  "EMPRESTIMOS BANCARIOS": "09.01",

  // --- Propaganda e marketing -> 05.05 ---
  "AGENCIA DE MARKETING E PUBLICIDADE": "05.05",
  "BRINDES": "05.05",
  "MATERIAL GRAFICO": "05.05",
  "PANFLETAGEM": "05.05",
  "PATROCINIO": "05.05",

  // --- Custos diretos (Interconexão/SVA) ---
  "LINK DE DADOS": "04.01",
  "TRANSPORTE DE DADOS": "04.01",
  "FULLTIME CAMERAS": "04.02",
  "FULLTIME RASTREADOR": "04.02",
  "WATCH TV": "04.02",
};

export const NAME_MAP = Object.fromEntries(
  Object.entries(RAW_MAP).map(([k, v]) => [norm(k), v])
);

// Items that legitimately appear in the monthly report but are intentionally left
// out of the DRE (internal cash/reserve movements, not income-statement items).
const RAW_EXCLUDED = [
  "Rotativo/Emprestimo",
  "AMORTIZAÇÃO/ROTATIVO",
  "INVESTIMENTOS FINANCEIROS",
  "RESERVA 13º + IPVA + IPTU",
  "RESERVA DO ICMS",
  "4.1 FROTA", // sub-header label with no value of its own, real amounts are in the "--" lines below it
];
export const EXCLUDED_NAMES = new Set(RAW_EXCLUDED.map(norm));

// Row-name patterns to skip outright (section headers, totals, cash balances —
// never shown as "matched" or "unmatched", just ignored).
const SKIP_PREFIXES = ["TOTAL DE ", "TOTAL ACUMULADO", "SALDO ATE", "[GRUPO]", "SOMATORIOS"];
const SKIP_EXACT = new Set([".", "-", ""]);

export function shouldSkipRow(descricao) {
  const n = norm(descricao);
  if (SKIP_EXACT.has(n)) return true;
  return SKIP_PREFIXES.some((p) => n.startsWith(p));
}

export function resolveByName(descricao) {
  const n = norm(descricao);
  if (NAME_MAP[n]) return { lineId: NAME_MAP[n] };
  if (EXCLUDED_NAMES.has(n)) return { excluded: true };
  return null;
}

export { norm as normalizeName };
