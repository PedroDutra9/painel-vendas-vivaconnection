import { useState, useEffect } from "react";
import { TrendingUp, FileBarChart, Headset, AlertTriangle } from "lucide-react";
import SalesDashboard from "./SalesDashboard.jsx";
import DreGerencial from "./DreGerencial.jsx";
import AtendimentosDashboard from "./AtendimentosDashboard.jsx";
import { COLORS, FONT_DISPLAY, FONT_BODY } from "./theme.js";
import { checkStorageHealth } from "./storage.js";

const TABS = [
  { id: "vendas", label: "Vendas", icon: TrendingUp },
  { id: "atendimentos", label: "Atendimentos", icon: Headset },
  { id: "dre", label: "DRE Gerencial", icon: FileBarChart },
];

export default function App() {
  const [tab, setTab] = useState("vendas");
  const [storageIssue, setStorageIssue] = useState(null);

  useEffect(() => {
    checkStorageHealth().then((result) => {
      if (!result.ok) setStorageIssue(result.error);
    });
  }, []);

  return (
    <div style={{ minHeight: "100%", background: COLORS.bg }}>
      {storageIssue && (
        <div style={{
          background: COLORS.redSoft, color: COLORS.red, fontFamily: FONT_BODY, fontSize: 13,
          padding: "10px 24px", display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
          textAlign: "center",
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          {storageIssue}
        </div>
      )}
      <div style={{
        borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", display: "flex", gap: 4 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "14px 6px", margin: "0 12px 0 0",
                  border: "none", background: "none", cursor: "pointer", fontFamily: FONT_BODY,
                  fontSize: 13.5, fontWeight: 600, color: active ? COLORS.teal : COLORS.inkMuted,
                  borderBottom: active ? `2.5px solid ${COLORS.teal}` : "2.5px solid transparent",
                  transition: "color 0.15s ease",
                }}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ maxWidth: tab === "vendas" ? "none" : 1180, margin: tab === "vendas" ? 0 : "0 auto", padding: tab === "vendas" ? 0 : "28px 24px 60px" }}>
        {tab === "vendas" && <SalesDashboard />}
        {tab === "atendimentos" && <AtendimentosDashboard />}
        {tab === "dre" && <DreGerencial />}
      </div>
    </div>
  );
}
