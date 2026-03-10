import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface ArticleForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  status: string;
  featuredImage: string;
  seoTitle: string;
  seoDescription: string;
  author: string;
}

const empty: ArticleForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "",
  status: "draft",
  featuredImage: "",
  seoTitle: "",
  seoDescription: "",
  author: "EntryLab",
};

export default function AdminArticleEditor() {
  const params = useParams<{ id?: string }>();
  const articleId = params.id;
  const isNew = !articleId;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ArticleForm>(empty);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate("/admin/login");
    }
  }, [session, sessionLoading, navigate]);

  const { data: existing, isLoading: articleLoading } = useQuery<any>({
    queryKey: ["/api/admin/articles", articleId],
    queryFn: () => fetch(`/api/admin/articles/${articleId}`, { credentials: "include" }).then((r) => r.json()),
    enabled: !isNew && !!session,
  });

  useEffect(() => {
    if (existing && !articleLoading) {
      setForm({
        title: existing.title || "",
        slug: existing.slug || "",
        excerpt: existing.excerpt || "",
        content: existing.content || "",
        category: existing.category || "",
        status: existing.status || "draft",
        featuredImage: existing.featuredImage || "",
        seoTitle: existing.seoTitle || "",
        seoDescription: existing.seoDescription || "",
        author: existing.author || "EntryLab",
      });
      setSlugTouched(true);
    }
  }, [existing, articleLoading]);

  const handleTitleChange = (val: string) => {
    setForm((f) => ({
      ...f,
      title: val,
      slug: slugTouched ? f.slug : slugify(val),
    }));
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      isNew
        ? apiRequest("POST", "/api/admin/articles", form)
        : apiRequest("PUT", `/api/admin/articles/${articleId}`, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      navigate("/admin/articles");
    },
    onError: (err: any) => {
      setSaveError(err?.message || "Failed to save article. Slug may already exist.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError("");
    saveMutation.mutate();
  };

  if (sessionLoading || (!isNew && articleLoading)) {
    return (
      <AdminLayout>
        <div className="space-y-4 max-w-3xl">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/articles">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold" data-testid="text-editor-title">
            {isNew ? "New Article" : "Edit Article"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Article title"
                required
                data-testid="input-title"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                placeholder="url-friendly-slug"
                data-testid="input-slug"
              />
              <p className="text-xs text-muted-foreground">Auto-generated from title. Edit if needed.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brokers">Brokers</SelectItem>
                  <SelectItem value="prop-firms">Prop Firms</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Short summary shown in article listings"
                rows={2}
                data-testid="input-excerpt"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="content">Content (HTML)</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="<p>Article body HTML...</p>"
                rows={16}
                className="font-mono text-xs"
                data-testid="input-content"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="featuredImage">Featured Image URL</Label>
              <Input
                id="featuredImage"
                value={form.featuredImage}
                onChange={(e) => setForm((f) => ({ ...f, featuredImage: e.target.value }))}
                placeholder="https://..."
                data-testid="input-featured-image"
              />
            </div>

            <div className="sm:col-span-2 border-t pt-5">
              <p className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wide text-xs">SEO</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={form.seoTitle}
                    onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                    placeholder="Search engine title (leave blank to use article title)"
                    data-testid="input-seo-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <Textarea
                    id="seoDescription"
                    value={form.seoDescription}
                    onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                    placeholder="Meta description for search engines (150-160 chars)"
                    rows={2}
                    data-testid="input-seo-description"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                placeholder="EntryLab"
                data-testid="input-author"
              />
            </div>
          </div>

          {saveError && (
            <p className="text-sm text-destructive" data-testid="text-save-error">{saveError}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={saveMutation.isPending || !form.title}
              className="gap-2"
              data-testid="button-save"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "Saving..." : "Save Article"}
            </Button>
            <Link href="/admin/articles">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
