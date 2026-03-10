import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  status: string;
  author: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export default function AdminArticles() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate("/admin/login");
    }
  }, [session, sessionLoading, navigate]);

  const { data: articles, isLoading } = useQuery<ArticleRow[]>({
    queryKey: ["/api/admin/articles"],
    enabled: !!session,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  if (sessionLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Articles</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your published and draft articles
            </p>
          </div>
          <Link href="/admin/articles/new">
            <Button className="gap-2" data-testid="button-new-article">
              <Plus className="w-4 h-4" />
              New Article
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">No articles yet</p>
            <p className="text-sm mt-1">Create your first article to get started</p>
            <Link href="/admin/articles/new">
              <Button className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                New Article
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr
                    key={article.id}
                    className="border-b last:border-0 hover-elevate"
                    data-testid={`row-article-${article.id}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium line-clamp-1">{article.title}</span>
                      <span className="text-xs text-muted-foreground block mt-0.5">{article.slug}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-muted-foreground capitalize">{article.category || "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge
                        variant={article.status === "published" ? "default" : "secondary"}
                        className="no-default-active-elevate"
                      >
                        {article.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {article.publishedAt
                        ? format(new Date(article.publishedAt), "MMM d, yyyy")
                        : format(new Date(article.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/articles/${article.id}/edit`}>
                          <Button size="icon" variant="ghost" data-testid={`button-edit-${article.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(article.id, article.title)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${article.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
