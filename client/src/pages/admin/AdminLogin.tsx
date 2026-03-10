import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/login", { password }),
    onSuccess: () => {
      navigate("/admin/articles");
    },
    onError: (err: any) => {
      setError(err?.message?.includes("429") ? "Too many attempts. Try again in 15 minutes." : "Incorrect password.");
      setPassword("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Admin Access</CardTitle>
          <CardDescription>EntryLab content management</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                data-testid="input-password"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" data-testid="text-login-error">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || !password}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
