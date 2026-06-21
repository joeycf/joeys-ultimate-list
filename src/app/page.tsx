import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const previews = [
  { rank: "01", title: "Best Anime", score: "9.7", type: "Top" },
  { rank: "02", title: "Burgers I've Tried", score: "8.9", type: "Top" },
  { rank: "03", title: "Favorite Pokémon", score: "—", type: "Favorites" },
];

export default function Home() {
  return (
    <main className="scanlines relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20">
      {/* ambient emerald glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald/20 blur-[120px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <p className="text-glow font-mono text-xs uppercase tracking-[0.35em] text-emerald">
          // Insert Coin
        </p>

        <h1 className="mt-5 font-display text-5xl font-bold tracking-tight sm:text-7xl">
          Joey&apos;s Ultimate List
        </h1>

        <p className="mt-5 max-w-xl text-balance text-muted-foreground">
          Favorites I love and Top lists I&apos;ve scored — browse the
          collections. The data-driven home arrives in Phase&nbsp;3; this screen
          is a preview of the design system.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button className="notch-sm">Enter</Button>
          <Button variant="outline" className="notch-sm">
            Browse favorites
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Badge className="bg-emerald text-background">Top</Badge>
          <Badge className="bg-violet text-background">Favorites</Badge>
          <Badge variant="outline" className="border-gold text-gold">
            Ranked
          </Badge>
        </div>

        {/* Notched, glowing "collection box" previews */}
        <div className="mt-14 grid w-full grid-cols-1 gap-5 sm:grid-cols-3">
          {previews.map((c) => (
            <div
              key={c.rank}
              className="notch group relative flex flex-col items-start gap-3 border border-border bg-card p-5 text-left transition duration-200 hover:border-emerald/60 hover:glow-drop"
            >
              <div className="flex w-full items-center justify-between font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <span className="text-gold">#{c.rank}</span>
                <span>{c.type}</span>
              </div>
              <h2 className="font-display text-xl font-semibold">{c.title}</h2>
              <div className="font-mono text-3xl font-bold text-gold">
                {c.score}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Score / 10
              </span>
            </div>
          ))}
        </div>

        {/* Jewel palette swatches */}
        <div className="mt-14 flex items-center gap-4">
          {[
            ["bg-emerald", "Emerald"],
            ["bg-violet", "Violet"],
            ["bg-gold", "Gold"],
          ].map(([cls, name]) => (
            <div key={name} className="flex items-center gap-2">
              <span className={`size-4 rounded-sm ${cls}`} />
              <span className="font-mono text-xs text-muted-foreground">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
