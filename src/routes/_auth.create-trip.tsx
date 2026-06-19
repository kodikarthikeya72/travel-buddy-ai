import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api, type Trip } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles } from "lucide-react";

const INTERESTS = ["Food", "Culture", "Adventure", "Shopping", "Nature", "History", "Nightlife"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const STYLES = ["Solo","Couple","Family","Friends"] as const;
const BUDGETS = ["Low","Medium","High"] as const;

export const Route = createFileRoute("/_auth/create-trip")({
  head: () => ({ meta: [{ title: "Create trip — Wayfare" }] }),
  component: CreateTrip,
});

function CreateTrip() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(5);
  const [budgetType, setBudgetType] = useState<typeof BUDGETS[number]>("Medium");
  const [interests, setInterests] = useState<string[]>(["Food", "Culture"]);
  const [travelMonth, setTravelMonth] = useState("June");
  const [travelStyle, setTravelStyle] = useState<typeof STYLES[number]>("Couple");

  const gen = useMutation({
    mutationFn: (payload: object) =>
      api<{ trip: Trip }>("/api/trips/generate", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (r) => {
      toast.success("Itinerary ready!");
      navigate({ to: "/trip/$id", params: { id: r.trip._id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  function toggleInterest(i: string) {
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!destination.trim()) { toast.error("Where are you going?"); return; }
    if (interests.length === 0) { toast.error("Pick at least one interest"); return; }
    gen.mutate({ destination: destination.trim(), days, budgetType, interests, travelMonth, travelStyle });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">Plan a new trip</h1>
      <p className="text-muted-foreground mt-1">Tell us a few details and we'll generate the rest.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6 rounded-xl border bg-card p-6 md:p-8 shadow-sm">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input id="destination" placeholder="e.g. Lisbon, Portugal" value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="days">Number of days</Label>
            <Input id="days" type="number" min={1} max={30} value={days} onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))} />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Budget</Label>
          <RadioGroup value={budgetType} onValueChange={(v) => setBudgetType(v as typeof BUDGETS[number])} className="flex gap-3 flex-wrap">
            {BUDGETS.map((b) => (
              <Label key={b} htmlFor={`b-${b}`} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 cursor-pointer hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem id={`b-${b}`} value={b} />
                {b}
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>Interests</Label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => {
              const active = interests.includes(i);
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => toggleInterest(i)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${active ? "border-primary bg-primary/10 text-primary" : "hover:bg-secondary"}`}
                >
                  {i}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Travel month</Label>
            <Select value={travelMonth} onValueChange={setTravelMonth}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Travel style</Label>
            <Select value={travelStyle} onValueChange={(v) => setTravelStyle(v as typeof STYLES[number])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={gen.isPending}>
          <Sparkles className="h-4 w-4 mr-2" />
          {gen.isPending ? "Generating your itinerary…" : "Generate AI itinerary"}
        </Button>
      </form>
    </div>
  );
}