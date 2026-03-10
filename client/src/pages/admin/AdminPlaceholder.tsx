import { AdminLayout } from "@/components/AdminLayout";
import { C, font } from "@/lib/adminTheme";

interface AdminPlaceholderProps {
  title: string;
  description: string;
}

export default function AdminPlaceholder({ title, description }: AdminPlaceholderProps) {
  return (
    <AdminLayout>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        textAlign: "center",
        fontFamily: font,
      }}>
        <div style={{ fontSize: 44, color: C.textDim, marginBottom: 18, lineHeight: 1 }}>◎</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 10px", fontFamily: font }}>
          {title}
        </h2>
        <p style={{ fontSize: 13, color: C.textMuted, maxWidth: 420, margin: 0, lineHeight: 1.6 }}>
          {description}
        </p>
      </div>
    </AdminLayout>
  );
}
