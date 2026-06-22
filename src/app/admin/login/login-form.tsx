"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  // Lightweight React 19 form state — no react-hook-form needed here.
  const [state, formAction, pending] = useActionState(login, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="password"
          className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
        >
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={state?.error ? true : undefined}
        />
      </div>

      {state?.error ? (
        <p className="font-mono text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="notch-sm w-full">
        {pending ? "Checking…" : "Enter"}
      </Button>
    </form>
  );
}
