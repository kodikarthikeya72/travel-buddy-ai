import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Plane, Sparkles, Wallet, Hotel } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wayfare — AI Travel Planner" },
      { name: "description", content: "Plan personalized trips with AI-generated itineraries, budgets, and hotel picks." },
      { property: "og:title", content: "Wayfare — AI Travel Planner" },
      { property: "og:description", content: "Plan personalized trips with AI-generated itineraries, budgets, and hotel picks." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Plane className="h-5 w-5 text-primary" />
          Wayfare
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost"><Link to="/login">Log in</Link></Button>
          <Button asChild><Link to="/register">Get started</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 pt-16 pb-24 md:pt-28">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Plan your next trip <span className="text-primary">in seconds</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Tell Wayfare where you're going and what you love. Get a day-by-day itinerary, a realistic budget, and hotel picks — all generated for you.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg"><Link to="/register">Plan a trip</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/login">I have an account</Link></Button>
        </div>
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { icon: Sparkles, title: "AI itineraries", body: "Tailored day-by-day plans based on your interests and travel style." },
            { icon: Wallet, title: "Smart budgets", body: "Flights, stays, food, activities — broken down clearly." },
            { icon: Hotel, title: "Hotel picks", body: "Curated stays matching your budget and vibe." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-sm">
              <f.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
