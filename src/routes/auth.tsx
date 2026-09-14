import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Logo, PetalDivider } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Logowanie do panelu | SiViK Flowers" },
      {
        name: "description",
        content: "Panel obsługi zamówień i produktów kwiaciarni SiViK Flowers.",
      },
      { property: "og:title", content: "Logowanie do panelu — SiViK Flowers" },
      {
        property: "og:description",
        content: "Dostęp dla obsługi kwiaciarni SiViK Flowers.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/admin" });
        } else {
          toast.success("Sprawdź skrzynkę e-mail i potwierdź konto.");
        }
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      if (raw.toLowerCase().includes("invalid login credentials")) {
        setMode("register");
        toast.error("Nie ma jeszcze takiego konta. Załóż je poniżej — pierwsze konto dostaje dostęp do panelu.");
      } else if (raw.toLowerCase().includes("already registered")) {
        setMode("login");
        toast.error("To konto już istnieje — zaloguj się.");
      } else {
        toast.error(raw || "Nie udało się zalogować");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center">
        <Logo size="sm" />
        <PetalDivider className="my-5" />
        <h1 className="text-3xl">{mode === "login" ? "Logowanie" : "Rejestracja"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Panel obsługi kwiaciarni</p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border border-border/70 bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Chwileczkę…" : mode === "login" ? "Zaloguj się" : "Załóż konto"}
        </Button>
        <button
          type="button"
          className="w-full text-center text-xs text-muted-foreground hover:text-primary"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Nie masz konta? Zarejestruj się" : "Masz już konto? Zaloguj się"}
        </button>
      </form>
    </div>
  );
}
