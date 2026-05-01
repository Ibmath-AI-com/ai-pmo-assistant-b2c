import React, { useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const C = {
  navBg: "#1E3A8A", primary: "#1E3A8A", primaryHover: "#1E3A8A", primaryLight: "#EFF6FF",
  accent: "#06B6D4", accentGrad: "linear-gradient(135deg,#06B6D4,#3B82F6)",
  tableHead: "#E8EAF6", tableHeadText: "#374151", rowHover: "#F8FAFF",
  border: "#E5E7EB", inputBorder: "#D1D5DB", inputFocus: "#3B82F6",
  pageBg: "#F8FAFC", text: "#1E293B", textSub: "#6B7280", textMuted: "#9CA3AF",
  cardBg: "#FFFFFF", cardBorder: "#E5E7EB", sectionLabel: "#1E3A8A",
  green: "#059669", greenBg: "#ECFDF5", yellow: "#D97706", yellowBg: "#FFFBEB",
  red: "#DC2626", redBg: "#FEF2F2", blue: "#2563EB", blueBg: "#EFF6FF",
  purple: "#7C3AED", purpleBg: "#F5F3FF", orange: "#EA580C", orangeBg: "#FFF7ED",
  sidebarActiveBg: "#EFF6FF", sidebarActiveText: "#1E3A8A", sidebarActiveBorder: "#2563EB",
  teal: "#0D9488", tealBg: "#F0FDFA",
};

interface FieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  required?: boolean;
}

export function Field({ label, placeholder, value, onChange, type = "text", multiline, rows = 3, hint, required }: FieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: `1.5px solid ${isFocused ? C.inputFocus : C.inputBorder}`,
    borderRadius: 8, background: "#fff", color: C.text, fontSize: 14, fontFamily: "inherit",
    outline: "none", transition: "border-color .15s, box-shadow .15s",
    boxShadow: isFocused ? `0 0 0 3px ${C.primaryLight}` : "none", resize: multiline ? "vertical" : "none"
  };
  const inputProps = {
    placeholder: placeholder || (required ? "Required" : ""), value: value || "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    style: inputStyle, onFocus: () => setIsFocused(true), onBlur: () => setIsFocused(false)
  };
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600, color: C.text }}>
        {label}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}</label>}
      {hint && <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>{hint}</div>}
      {multiline ? <textarea rows={rows} {...inputProps} /> : <input type={type} {...inputProps} />}
    </div>
  );
}

interface SelOption {
  v?: string;
  l?: string;
}

interface SelProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  options: (SelOption | string)[];
  placeholder?: string;
  required?: boolean;
}

export function Sel({ label, value, onChange, options, placeholder, required }: SelProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", marginBottom: 5, fontSize: 13, fontWeight: 600, color: C.text }}>
        {label}{required && <span style={{ color: C.red, marginLeft: 3 }}>*</span>}</label>}
      <select value={value || ""} onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px", border: `1.5px solid ${C.inputBorder}`, borderRadius: 8,
          background: "#fff", color: value ? C.text : C.textMuted, fontSize: 14, fontFamily: "inherit", outline: "none", cursor: "pointer"
        }}>
        <option value="" disabled>{placeholder || "Select…"}</option>
        {options.map(o => {
          const optionObj = o as SelOption;
          return <option key={optionObj.v || (o as string)} value={optionObj.v || (o as string)}>{optionObj.l || (o as string)}</option>;
        })}
      </select>
    </div>
  );
}

type BtnVariant = "primary" | "outline" | "danger" | "ghost";

interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  sx?: React.CSSProperties;
}

export function Btn({ children, onClick, variant = "primary", sx }: BtnProps) {
  const variantStyles: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: C.primary, color: "#fff", border: "none" },
    outline: { background: "#fff", color: C.primary, border: `1.5px solid ${C.primary}` },
    danger: { background: C.redBg, color: C.red, border: `1px solid #FECACA` },
    ghost: { background: "transparent", color: C.textSub, border: `1.5px solid ${C.border}` }
  };
  return <button onClick={onClick} style={{
    padding: "9px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s,transform .1s", ...variantStyles[variant], ...sx
  }}
    onMouseDown={e => (e.currentTarget.style.transform = "scale(.97)")}
    onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}>{children}</button>;
}

interface SLProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const SL = ({ children, style }: SLProps) => (
  <div style={{ fontSize: 13, fontWeight: 700, color: C.sectionLabel, marginBottom: 16, letterSpacing: ".3px", paddingBottom: 8, borderBottom: `1px solid ${C.border}`, ...style }}>
    {children}
  </div>
);

interface PTProps {
  children: React.ReactNode;
  sub?: string;
}

export const PT = ({ children, sub }: PTProps) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{children}</div>
    {sub && <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>{sub}</div>}
  </div>
);

interface CardProps {
  children: React.ReactNode;
  sx?: React.CSSProperties;
}

export const Card = ({ children, sx }: CardProps) => (
  <div style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: 12, padding: 24, marginBottom: 20, ...sx }}>
    {children}
  </div>
);

export const Divider = () => <div style={{ height: 1, background: C.border, margin: "20px 0" }} />;

interface TDProps {
  children?: React.ReactNode;
  sx?: React.CSSProperties;
}

export const TD = ({ children, sx }: TDProps) => (
  <td style={{ padding: "11px 14px", color: C.text, verticalAlign: "middle", ...sx }}>{children}</td>
);

interface BadgeProps {
  color: string;
  bg: string;
  children: React.ReactNode;
}

export function Badge({ color, bg, children }: BadgeProps) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color }}>{children}</span>;
}

interface SBadgeProps {
  status: string;
}

export function SBadge({ status }: SBadgeProps) {
  const statusMap: Record<string, { c: string; b: string }> = {
    "Not Started": { c: C.textSub, b: "#F3F4F6" }, "In Progress": { c: C.yellow, b: C.yellowBg },
    "Completed": { c: C.green, b: C.greenBg }, "Completed Successfully": { c: C.green, b: C.greenBg },
    "On Hold": { c: C.orange, b: C.orangeBg }, "Active": { c: C.green, b: C.greenBg },
    "Closed": { c: C.textSub, b: "#F3F4F6" }, "High": { c: C.red, b: C.redBg },
    "Medium": { c: C.yellow, b: C.yellowBg }, "Low": { c: C.green, b: C.greenBg },
    "Critical": { c: "#7C2D12", b: "#FEF2F2" }, "On Track": { c: C.green, b: C.greenBg },
    "At Risk": { c: C.yellow, b: C.yellowBg }, "Off Track": { c: C.red, b: C.redBg },
    "Open": { c: C.blue, b: C.blueBg }, "Mitigated": { c: C.green, b: C.greenBg },
    "Resolved": { c: C.green, b: C.greenBg }, "Approved": { c: C.green, b: C.greenBg },
    "Rejected": { c: C.red, b: C.redBg }, "Pending": { c: C.yellow, b: C.yellowBg },
    "Planned": { c: C.blue, b: C.blueBg }, "Realized": { c: C.green, b: C.greenBg },
  };
  const statusStyle = statusMap[status] || { c: C.textSub, b: "#F3F4F6" };
  return <Badge color={statusStyle.c} bg={statusStyle.b}><span style={{ width: 6, height: 6, borderRadius: "50%", background: statusStyle.c, display: "inline-block" }} />{status}</Badge>;
}

interface TWProps {
  headers: string[];
  rows: React.ReactNode[][];
}

export function TW({ headers, rows }: TWProps) {
  return (
    <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ background: C.tableHead }}>
          {headers.map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: C.tableHeadText, fontSize: 11, textTransform: "uppercase", letterSpacing: ".5px", borderBottom: `1px solid ${C.border}` }}>{h}</th>)}
        </tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index} style={{ borderBottom: index < rows.length - 1 ? `1px solid ${C.border}` : "none" }}
          onMouseEnter={e => (e.currentTarget.style.background = C.rowHover)}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>{row}</tr>)}</tbody>
      </table>
    </div>
  );
}

interface ToggleProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  small?: boolean;
}

export function Toggle({ options, value, onChange, small }: ToggleProps) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {options.map(o => {
        const isActive = value === o;
        return <button key={o} onClick={() => onChange(o)} style={{
          padding: small ? "4px 10px" : "6px 14px", borderRadius: 20,
          border: `1.5px solid ${isActive ? C.primary : C.inputBorder}`, background: isActive ? C.primary : "#fff",
          color: isActive ? "#fff" : C.textSub, fontSize: small ? 11 : 12, fontWeight: 600, cursor: "pointer", transition: "all .12s"
        }}>{o}</button>;
      })}
    </div>
  );
}

interface RmBtnProps {
  onClick: () => void;
}

export const RmBtn = ({ onClick }: RmBtnProps) => (
  <button onClick={onClick} style={{ padding: "3px 8px", borderRadius: 6, border: "none", background: C.redBg, color: C.red, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>✕</button>
);

interface AddBtnProps {
  onClick: () => void;
  label?: string;
}

export const AddBtn = ({ onClick, label = "+ Add Row" }: AddBtnProps) => (
  <button onClick={onClick} style={{ marginTop: 8, padding: "7px 16px", borderRadius: 7, border: `1.5px dashed ${C.inputFocus}`, background: C.primaryLight, color: C.primary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
);

interface TabItem {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: (TabItem | string)[];
  active: string;
  onChange: (id: string) => void;
}

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "#F3F4F6", borderRadius: 10, padding: 4 }}>
      {tabs.map(t => {
        const tabItem = t as TabItem;
        const id = tabItem.id || (t as string);
        const label = tabItem.label || (t as string);
        return (
          <button key={id} onClick={() => onChange(id)}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: active === id ? "#fff" : "transparent",
              color: active === id ? C.primary : C.textSub, fontWeight: active === id ? 700 : 500, fontSize: 13,
              cursor: "pointer", fontFamily: "inherit", boxShadow: active === id ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: "all .15s"
            }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

interface FooterBtnsProps {
  onSave?: () => void;
  onSubmit?: () => void;
  saveLabel?: string;
  submitLabel?: string;
}

export function FooterBtns({ onSave, onSubmit, saveLabel = "Save Draft", submitLabel = "Submit" }: FooterBtnsProps) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
      <Btn variant="outline" onClick={onSave}>{saveLabel}</Btn>
      <Btn onClick={onSubmit}>{submitLabel}</Btn>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  bg: string;
}

export function StatCard({ label, value, color, bg }: StatCardProps) {
  return (
    <div style={{ padding: "10px 18px", borderRadius: 10, background: bg, border: `1px solid ${color}33`, minWidth: 100 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: ".4px" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}
