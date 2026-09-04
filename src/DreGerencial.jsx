import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Upload, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, History,
  ChevronDown, ChevronRight, RotateCcw, Info, X,
} from "lucide-react";
import { COLORS, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "./theme.js";
import { DRE_GROUPS, SUBTOTALS } from "./dreMapping.js";
import { parseDreFileByName as parseDreFile } from "./dreParserByName.js";

const STORAGE_PREFIX = "dre-snapshot:";
const LOG_KEY = "dre-import-log";

const MESES_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthOptions() {
  const opts = [];
  const year = new Date().getFullYear();
  for (const y of [year - 1, year, year + 1]) {
    for (let m = 1; m <= 12; m++) {
      opts.push(`${y}-${String(m).padStart(2, "0")}`);
    }
  }
  return opts;
}

function monthLabel(key) {
  const [y, m] = key.split("-");
  return `${MESES_PT[parseInt(m, 10) - 1]} de ${y}`;
}
function monthShort(key) {
  const [y, m] = key.split("-");
  return `${MESES_PT[parseInt(m, 10) - 1].slice(0, 3)}/${y.slice(2)}`;
}

function fmtBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);
}
function fmtBRLFull(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}
function fmtPct(v) {
  if (!isFinite(v)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(v);
}

function computeDre(byLine) {
  const groupTotals = {};
  DRE_GROUPS.forEach((g) => {
    let total = 0;
    g.lines.forEach((line) => { total += byLine[line.id] || 0; });
    groupTotals[g.id] = total * g.sign;
  });
  const subtotalValues = {};
  SUBTOTALS.forEach((s) => {
    subtotalValues[s.id] = s.groups.reduce((sum, gId) => sum + (groupTotals[gId] || 0), 0);
  });
  const receita = groupTotals["g1"] || 0;
  return { groupTotals, subtotalValues, receita };
}

function ReconcilePreview({ result, onConfirm, onCancel, monthKey }) {
  const [showUnmatched, setShowUnmatched] = useState(true);
  const totalMatched = result.matched.reduce((s, r) => s + r.value, 0);
  const totalUnmatched = result.unmatched.reduce((s, r) => s + r.value, 0);

  const byLineLabel = useMemo(() => {
    const lineLabels = {};
    DRE_GROUPS.forEach((g) => g.lines.forEach((l) => { lineLabels[l.id] = { label: l.label, group: g.label }; }));
    const rows = {};
    result.matched.forEach((m) => {
      if (!rows[m.lineId]) rows[m.lineId] = { ...lineLabels[m.lineId], total: 0, count: 0 };
      rows[m.lineId].total += m.value;
      rows[m.lineId].count += 1;
    });
    return Object.values(rows).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }, [result]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(24,37,35,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20,
    }}>
      <div style={{
        background: COLORS.surface, borderRadius: 12, maxWidth: 640, width: "100%",
        maxHeight: "85vh", overflow: "auto", padding: "24px 26px", fontFamily: FONT_BODY,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, margin: 0, color: COLORS.ink }}>
            Conferir antes de salvar
          </h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkMuted, padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: COLORS.inkMuted, marginTop: 4, marginBottom: 16 }}>
          Referente a {monthLabel(monthKey)}. Veja se os valores reconhecidos batem antes de confirmar.
        </p>

        <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 140px", background: COLORS.greenSoft, borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 11.5, color: COLORS.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              <CheckCircle2 size={13} /> Reconhecidos
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 600, color: COLORS.ink, marginTop: 3 }}>
              {result.matched.length} linhas
            </div>
          </div>
          {result.excluded && result.excluded.length > 0 && (
            <div style={{ flex: "1 1 140px", background: COLORS.purpleSoft || "#EEE", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 11.5, color: COLORS.purple || COLORS.inkMuted, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <Info size={13} /> Fora do DRE (proposital)
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 600, color: COLORS.ink, marginTop: 3 }}>
                {result.excluded.length} linhas
              </div>
            </div>
          )}
          {result.unmatched.length > 0 && (
            <div style={{ flex: "1 1 140px", background: COLORS.amberSoft, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 11.5, color: COLORS.amber, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <AlertTriangle size={13} /> Não reconhecidos
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 600, color: COLORS.ink, marginTop: 3 }}>
                {result.unmatched.length} linhas
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.inkMuted, marginBottom: 8 }}>Valores por linha do DRE</div>
        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
          {byLineLabel.map((row, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", padding: "8px 12px", fontSize: 12.5,
              borderBottom: i < byLineLabel.length - 1 ? `1px solid ${COLORS.bg}` : "none",
              background: i % 2 === 1 ? COLORS.bg : "transparent",
            }}>
              <span style={{ color: COLORS.ink }}>{row.label} <span style={{ color: COLORS.inkMuted }}>({row.count})</span></span>
              <span style={{ fontFamily: FONT_MONO, fontWeight: 600 }}>{fmtBRLFull(row.total)}</span>
            </div>
          ))}
          {byLineLabel.length === 0 && (
            <div style={{ padding: 16, textAlign: "center", color: COLORS.inkMuted, fontSize: 12.5 }}>
              Nenhum código reconhecido neste arquivo.
            </div>
          )}
        </div>

        {result.unmatched.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setShowUnmatched((s) => !s)}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: COLORS.amber, padding: 0 }}
            >
              {showUnmatched ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Códigos não reconhecidos ({fmtBRLFull(totalUnmatched)})
            </button>
            {showUnmatched && (
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden", marginTop: 8, maxHeight: 180, overflowY: "auto" }}>
                {result.unmatched.map((u, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", padding: "6px 12px", fontSize: 12,
                    borderBottom: i < result.unmatched.length - 1 ? `1px solid ${COLORS.bg}` : "none",
                  }}>
                    <span style={{ color: COLORS.inkMuted }}>{u.descricao}</span>
                    <span style={{ fontFamily: FONT_MONO }}>{fmtBRLFull(u.value)}</span>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: 11.5, color: COLORS.inkMuted, marginTop: 6 }}>
              Esses códigos não estão no mapeamento do DRE — não entram no cálculo. Pode ser uma conta nova do plano de contas.
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "9px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#fff",
              color: COLORS.inkMuted, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: FONT_BODY,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "9px 18px", borderRadius: 8, border: "none", background: COLORS.teal,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY,
            }}
          >
            Confirmar e salvar mês
          </button>
        </div>
      </div>
    </div>
  );
}

function DreLine({ label, value, receita, indent, bold, sub }) {
  const pct = receita ? value / receita : NaN;
  return (
    <div style={{
      display: "flex", alignItems: "center", padding: bold ? "9px 12px" : "6px 12px 6px " + (12 + indent * 16) + "px",
      fontSize: bold ? 13 : 12.5, fontFamily: FONT_BODY, color: bold ? COLORS.ink : COLORS.inkSoft,
      fontWeight: bold ? 700 : 400,
      background: sub ? COLORS.tealSoft : "transparent",
      borderTop: sub ? `1px solid ${COLORS.border}` : "none",
      borderBottom: sub ? `1px solid ${COLORS.border}` : "none",
    }}>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: bold ? 13 : 12.5, fontWeight: bold ? 700 : 500, width: 120, textAlign: "right", color: value < 0 ? COLORS.red : COLORS.ink }}>
        {fmtBRL(value)}
      </span>
      <span style={{ fontFamily: FONT_MONO, fontSize: 11, width: 60, textAlign: "right", color: COLORS.inkMuted }}>
        {fmtPct(pct)}
      </span>
    </div>
  );
}

export default function DreGerencial() {
  const [snapshots, setSnapshots] = useState({});
  const [importLog, setImportLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [pendingResult, setPendingResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadMsg, setUploadMsg] = useState(null);
  const fileInputRef = useRef(null);
  const months = useMemo(() => monthOptions(), []);

  useEffect(() => {
    (async () => {
      const loaded = {};
      for (const m of months) {
        try {
          const res = await window.storage.get(STORAGE_PREFIX + m, false);
          if (res && res.value) loaded[m] = JSON.parse(res.value);
        } catch (e) { /* not saved yet */ }
      }
      let log = [];
      try {
        const res = await window.storage.get(LOG_KEY, false);
        if (res && res.value) log = JSON.parse(res.value);
      } catch (e) { /* none yet */ }
      setSnapshots(loaded);
      setImportLog(log);
      setLoading(false);
      const monthsWithData = Object.keys(loaded).sort();
      if (monthsWithData.length && !loaded[currentMonthKey()]) {
        setSelectedMonth(monthsWithData[monthsWithData.length - 1]);
      }
    })();
  }, []);

  const handleFile = useCallback(async (file) => {
    setUploadError(null);
    setUploadMsg(null);
    try {
      const result = await parseDreFile(file);
      if (result.matched.length === 0 && result.unmatched.length === 0 && result.excluded.length === 0) {
        setUploadError("Não encontrei nenhuma linha reconhecível nesse arquivo. Confira se é o mesmo formato do demonstrativo financeiro mensal.");
        return;
      }
      setPendingResult(result);
    } catch (e) {
      setUploadError("Não consegui ler esse arquivo. Confira se é um .xlsx.");
    }
  }, []);

  const confirmSave = useCallback(async () => {
    if (!pendingResult) return;
    const dre = computeDre(pendingResult.byLine);
    const snapshot = { byLine: pendingResult.byLine, dre, importedAt: new Date().toISOString() };
    const newSnapshots = { ...snapshots, [selectedMonth]: snapshot };
    const newLog = [
      { date: new Date().toISOString(), month: selectedMonth, matched: pendingResult.matched.length, unmatched: pendingResult.unmatched.length },
      ...importLog,
    ].slice(0, 30);
    setSnapshots(newSnapshots);
    setImportLog(newLog);
    setPendingResult(null);
    setUploadMsg(`DRE de ${monthLabel(selectedMonth)} salvo.`);
    try {
      await window.storage.set(STORAGE_PREFIX + selectedMonth, JSON.stringify(snapshot), false);
      await window.storage.set(LOG_KEY, JSON.stringify(newLog), false);
    } catch (e) { /* ignore */ }
  }, [pendingResult, snapshots, selectedMonth, importLog]);

  const clearMonth = useCallback(async () => {
    if (!window.confirm(`Apagar o DRE salvo de ${monthLabel(selectedMonth)}?`)) return;
    const next = { ...snapshots };
    delete next[selectedMonth];
    setSnapshots(next);
    try { await window.storage.delete(STORAGE_PREFIX + selectedMonth, false); } catch (e) { /* ignore */ }
  }, [snapshots, selectedMonth]);

  const current = snapshots[selectedMonth];
  const dre = current ? current.dre : null;

  const trend = useMemo(() => {
    return months
      .filter((m) => snapshots[m])
      .sort()
      .map((m) => ({
        month: m,
        label: monthShort(m),
        receita: snapshots[m].dre.receita,
        resop: snapshots[m].dre.subtotalValues["resop"],
      }));
  }, [snapshots, months]);

  if (loading) {
    return <div style={{ fontFamily: FONT_BODY, padding: 40, color: COLORS.inkMuted }}>Carregando DRE…</div>;
  }

  return (
    <div style={{ fontFamily: FONT_BODY, color: COLORS.ink }}>
      {pendingResult && (
        <ReconcilePreview
          result={pendingResult}
          monthKey={selectedMonth}
          onConfirm={confirmSave}
          onCancel={() => setPendingResult(null)}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>DRE Gerencial</h1>
          <p style={{ fontSize: 13, color: COLORS.inkMuted, margin: 0 }}>
            {Object.keys(snapshots).length} {Object.keys(snapshots).length === 1 ? "mês salvo" : "meses salvos"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: "9px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#fff",
              fontFamily: FONT_BODY, fontSize: 13, color: COLORS.ink, cursor: "pointer",
            }}
          >
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}{snapshots[m] ? " ✓" : ""}</option>
            ))}
          </select>
          {current && (
            <button
              onClick={clearMonth}
              title="Apagar este mês"
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "9px 12px", borderRadius: 8,
                border: `1px solid ${COLORS.border}`, background: "#fff", color: COLORS.inkMuted,
                fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: FONT_BODY,
              }}
            >
              <RotateCcw size={13} /> Limpar
            </button>
          )}
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, border: "none",
              background: COLORS.teal, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT_BODY,
            }}
          >
            <Upload size={14} /> Subir XLS do mês
          </button>
          <input
            ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </div>
      </div>

      {(uploadMsg || uploadError) && (
        <div style={{
          marginBottom: 18, padding: "10px 14px", borderRadius: 8, fontSize: 13, fontFamily: FONT_BODY,
          background: uploadError ? COLORS.redSoft : COLORS.greenSoft,
          color: uploadError ? COLORS.red : COLORS.green, display: "flex", alignItems: "center", gap: 8,
        }}>
          <Info size={14} /> {uploadError || uploadMsg}
        </div>
      )}

      {trend.length > 1 && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>Receita e resultado operacional por mês</div>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 90 }}>
            {trend.map((t) => {
              const maxV = Math.max(...trend.map((x) => Math.abs(x.receita)), 1);
              const h = Math.max(4, (Math.abs(t.receita) / maxV) * 70);
              const hOp = Math.max(2, (Math.abs(t.resop) / maxV) * 70);
              return (
                <div key={t.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 70 }}>
                    <div style={{ width: 10, height: h, background: COLORS.teal, borderRadius: "3px 3px 0 0" }} title={fmtBRLFull(t.receita)} />
                    <div style={{ width: 10, height: hOp, background: t.resop >= 0 ? COLORS.green : COLORS.red, borderRadius: "3px 3px 0 0" }} title={fmtBRLFull(t.resop)} />
                  </div>
                  <span style={{ fontSize: 10, color: COLORS.inkMuted, fontFamily: FONT_BODY }}>{t.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11.5, color: COLORS.inkMuted }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: COLORS.teal, display: "inline-block" }} /> Receita</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: COLORS.green, display: "inline-block" }} /> Resultado operacional</span>
          </div>
        </div>
      )}

      {!current ? (
        <div style={{
          background: COLORS.surface, border: `1px dashed ${COLORS.border}`, borderRadius: 10, padding: "40px 20px",
          textAlign: "center", color: COLORS.inkMuted, fontSize: 13.5,
        }}>
          Nenhum DRE salvo para {monthLabel(selectedMonth)} ainda. Suba o XLS do mês para conciliar.
        </div>
      ) : (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "14px 12px 6px", display: "flex", justifyContent: "flex-end", gap: 0 }}>
            <span style={{ width: 120, textAlign: "right", fontSize: 11, fontWeight: 600, color: COLORS.inkMuted }}>Valor</span>
            <span style={{ width: 60, textAlign: "right", fontSize: 11, fontWeight: 600, color: COLORS.inkMuted }}>%</span>
          </div>
          {DRE_GROUPS.map((g) => {
            const groupVal = dre.groupTotals[g.id];
            const showSubtotalAfter = SUBTOTALS.find((s) => s.afterGroup === g.id);
            return (
              <div key={g.id}>
                <DreLine label={`${g.num}. ${g.label}`} value={groupVal} receita={dre.receita} bold />
                {g.lines.map((line) => (
                  <DreLine key={line.id} label={line.label} value={(current.byLine[line.id] || 0) * g.sign} receita={dre.receita} indent={1} />
                ))}
                {showSubtotalAfter && (
                  <DreLine label={showSubtotalAfter.label} value={dre.subtotalValues[showSubtotalAfter.id]} receita={dre.receita} bold sub />
                )}
              </div>
            );
          })}
        </div>
      )}

      {importLog.length > 0 && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <History size={14} color={COLORS.inkMuted} />
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13.5, fontWeight: 600 }}>Histórico de conciliações</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {importLog.slice(0, 6).map((log, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: COLORS.inkSoft, padding: "4px 0" }}>
                <span style={{ fontWeight: 500 }}>{monthLabel(log.month)}</span>
                <span style={{ color: COLORS.inkMuted }}>
                  {new Date(log.date).toLocaleDateString("pt-BR")} · {log.matched} reconhecidos, {log.unmatched} ignorados
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: 11.5, color: COLORS.inkMuted, marginTop: 20, textAlign: "center" }}>
        As categorias do demonstrativo mensal são reconhecidas pelo nome automaticamente.
        Linhas sem conta vinculada ("Devoluções e Abatimentos", "Material para Revenda", "Receitas Financeiras")
        ficam zeradas se o mês não tiver nenhum valor lançado nelas.
      </p>
    </div>
  );
}
