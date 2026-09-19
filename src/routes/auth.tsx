import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Logo, PetalDivider } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasAnyAccount, login, register } from "@/lib/auth.functions";

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
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await login({ data: { email, password } });
      } else {
        await register({ data: { email, password } });
      }
      // The session cookie is set server-side, so anything cached for the
      // previous visitor has to go before the panel loads.
      await queryClient.resetQueries();
      navigate({ to: "/admin" });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      if (raw.includes("Nieprawidłowy e-mail lub hasło")) {
        // Before any account exists the owner has to register first, so point
        // them at the form instead of repeating "wrong password".
        if (mode === "login" && !(await hasAnyAccount())) {
          setMode("register");
          toast.error(
            "Nie ma jeszcze żadnego konta. Załóż je poniżej — pierwsze konto dostaje dostęp do panelu.",
          );
        } else {
          toast.error(raw);
        }
      } else if (raw.includes("już istnieje")) {
        setMode("login");
        toast.error(raw);
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
