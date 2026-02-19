import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type CallbackState = {
  status: "loading" | "error";
  message: string;
};

function getSafeNextPath(rawPath: string | null): string {
  if (!rawPath) return "/admin";
  if (!rawPath.startsWith("/")) return "/admin";
  if (rawPath.startsWith("//")) return "/admin";
  return rawPath;
}

export default function AdminLoginCallback() {
  const [state, setState] = useState<CallbackState>({
    status: "loading",
    message: "Completing sign in...",
  });

  const nextPath = useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    return getSafeNextPath(search.get("next"));
  }, []);

  useEffect(() => {
    const run = async () => {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const oauthError = hash.get("error_description") || hash.get("error");

      if (oauthError) {
        setState({
          status: "error",
          message: oauthError,
        });
        return;
      }

      if (!accessToken) {
        setState({
          status: "error",
          message: "Missing Supabase access token from OAuth callback.",
        });
        return;
      }

      try {
        const response = await fetch("/api/auth/supabase/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ accessToken }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ message: "Failed to create session" }));
          throw new Error(payload.message || "Failed to create session");
        }

        window.location.replace(nextPath);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Sign in failed";
        setState({
          status: "error",
          message,
        });
      }
    };

    void run();
  }, [nextPath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            {state.status === "loading" ? "Authorizing your admin session..." : "Could not complete sign in."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.status === "loading" ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{state.message}</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-destructive">{state.message}</p>
              <Button
                className="w-full"
                onClick={() => {
                  window.location.href = "/admin/login";
                }}
                data-testid="button-admin-login-retry"
              >
                Back to login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
