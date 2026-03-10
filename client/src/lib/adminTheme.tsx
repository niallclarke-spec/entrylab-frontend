export const C = {
  bg: "#0B0E11",
  surface: "#12161C",
  surfaceHover: "#181D25",
  border: "#1E2530",
  borderLight: "#2A3140",
  text: "#E8ECF1",
  textMuted: "#7A8599",
  textDim: "#4A5568",
  accent: "#08F295",
  accentDim: "rgba(8, 242, 149, 0.10)",
  accentBorder: "rgba(8, 242, 149, 0.25)",
  warning: "#F2A208",
  danger: "#F24B4B",
  info: "#4B9CF2",
} as const;

export const font = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";

export const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  published: { bg: "rgba(8,242,149,0.1)", color: "#08F295", border: "rgba(8,242,149,0.2)" },
  draft:     { bg: "rgba(122,133,153,0.1)", color: "#7A8599", border: "rgba(122,133,153,0.2)" },
  pending:   { bg: "rgba(242,162,8,0.12)", color: "#F2A208", border: "rgba(242,162,8,0.25)" },
  approved:  { bg: "rgba(8,242,149,0.1)", color: "#08F295", border: "rgba(8,242,149,0.2)" },
  flagged:   { bg: "rgba(242,75,75,0.12)", color: "#F24B4B", border: "rgba(242,75,75,0.25)" },
  scheduled: { bg: "rgba(75,156,242,0.12)", color: "#4B9CF2", border: "rgba(75,156,242,0.25)" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] || statusStyles.draft;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.3px",
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      textTransform: "capitalize" as const,
      whiteSpace: "nowrap" as const,
    }}>
      {status}
    </span>
  );
}

export function ActionBtn({
  label, primary, danger, small, onClick, disabled, type = "button",
}: {
  label: string;
  primary?: boolean;
  danger?: boolean;
  small?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "5px 12px" : "8px 18px",
        borderRadius: 7,
        border: primary ? "none" : `1px solid ${danger ? C.danger : C.borderLight}`,
        background: primary ? C.accent : "transparent",
        color: primary ? C.bg : danger ? C.danger : C.textMuted,
        fontSize: small ? 12 : 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s ease",
        fontFamily: font,
        whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </button>
  );
}

export function AdminInput({
  placeholder, type = "text", value, onChange, onFocus, onBlur,
}: {
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        padding: "10px 14px",
        borderRadius: 7,
        border: `1px solid ${C.border}`,
        background: C.bg,
        color: C.text,
        fontSize: 13,
        fontFamily: font,
        outline: "none",
        boxSizing: "border-box" as const,
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => { e.target.style.borderColor = C.accent; onFocus?.(); }}
      onBlur={(e) => { e.target.style.borderColor = C.border; onBlur?.(); }}
    />
  );
}
