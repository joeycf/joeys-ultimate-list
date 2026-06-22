import { logout } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald">
          Dashboard
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Admin
        </h1>
        <p className="mt-2 text-muted-foreground">
          Collection management coming in Phase&nbsp;5.
        </p>
      </div>

      <form action={logout}>
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </div>
  );
}
