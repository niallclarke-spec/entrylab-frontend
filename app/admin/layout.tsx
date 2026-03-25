"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, TrendingUp, FileText, GitCompare, Tag, BarChart3, LogOut, Settings } from "lucide-react";

const AuthContext = createContext<{ token: string | null; setToken: (t: string | null) => void }>({ token: null, setToken: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/brokers", label: "Brokers", icon: Shield },
  { href: "/admin/prop-firms", label: "Prop Firms", icon: TrendingUp },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/comparisons", label: "Comparisons", icon: GitCompare },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/seo", label: "SEO", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("admin_token");
    if (stored) setToken(stored);
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("admin_token", data.token);
        setToken(data.token);
      } else {
        setError(data.error || "Invalid password");
      }
    } catch {
      setError("Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  if (loading) return <div className="flex-1 flex items-center justify-center py-32" style={{ color: "#6b7280" }}>Loading...</div>;

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center py-32" style={{ background: "#f8faf8" }}>
        <div className="w-full max-w-sm mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: "#111827" }}>Admin Login</h1>
          <form onSubmit={handleLogin} className="rounded-xl p-6 space-y-4" style={{ background: "#fff", border: "1px solid #e8edea" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-[#2bb32a]/30"
              style={{ borderColor: "#e8edea" }}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" className="w-full px-4 py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "#2bb32a" }}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      <div className="flex-1 flex" style={{ background: "#f8faf8" }}>
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden md:block" style={{ background: "#1a1e1c", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="p-6">
            <h2 className="text-white font-bold text-lg mb-6">Admin Panel</h2>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive ? "text-white bg-white/10" : "text-[#adb2b1] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#adb2b1] hover:text-white hover:bg-white/5 transition-colors mt-8 w-full"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          {children}
        </div>
      </div>
    </AuthContext.Provider>
  );
}
