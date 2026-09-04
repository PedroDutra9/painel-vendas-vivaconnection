import { useState } from "react";
import { TrendingUp, FileBarChart } from "lucide-react";
import SalesDashboard from "./SalesDashboard.jsx";
import DreGerencial from "./DreGerencial.jsx";
import { COLORS, FONT_DISPLAY, FONT_BODY } from "./theme.js";

const TABS = [
  { id: "vendas", label: "Vendas", icon: TrendingUp },
  { id: "dre", label: "DRE Gerencial", icon: FileBarChart },
];

export default function App() {
  const [tab, setTab] = useState("vendas");

  return (
    <div style={{ minHeight: "100%", background: COLORS.bg }}>
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
      <div style={{ maxWidth: tab === "dre" ? 1180 : "none", margin: tab === "dre" ? "0 auto" : 0, padding: tab === "dre" ? "28px 24px 60px" : 0 }}>
        {tab === "vendas" ? <SalesDashboard /> : <DreGerencial />}
      </div>
    </div>
  );
}
