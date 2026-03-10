import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { FileText, LogOut } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/logout"),
    onSuccess: () => {
      queryClient.clear();
      navigate("/admin/login");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-sm tracking-wide">EntryLab Admin</span>
            <nav className="flex items-center gap-1">
              <Link href="/admin/articles">
                <Button
                  variant={location.startsWith("/admin/articles") ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Articles
                </Button>
              </Link>
            </nav>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
