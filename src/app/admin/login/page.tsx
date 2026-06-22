import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin Login — Joey's Ultimate List",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="size-3.5 rotate-45 rounded-[3px] bg-emerald shadow-[0_0_12px_var(--color-emerald)]" />
          <span className="font-display text-sm font-semibold tracking-tight">
            Joey&apos;s Ultimate List
          </span>
        </div>

        <div className="notch border border-border bg-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald">
            Admin
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">
            Enter the console
          </h1>
          <p className="mb-5 mt-1 text-sm text-muted-foreground">
            One password. Just you.
          </p>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
