import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, type Trip } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  ArrowLeft, MapPin, Calendar, Plane, Hotel, Wallet, Utensils,
  Ticket, Star, Download, RefreshCw, Plus, Trash2, Save, CloudSun, Share2, Copy, Link2Off,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_auth/trip/$id")({
  head: () => ({ meta: [{ title: "Trip — Wayfare" }] }),
  component: TripPage,
});

type DayPlan = { day: number; activities: string[] };

function ShareDialogContent({
  trip, onEnable, onRevoke, enabling, revoking,
}: {
  trip: Trip;
  onEnable: () => void;
  onRevoke: () => void;
  enabling: boolean;
  revoking: boolean;
}) {
  const url = trip.shareToken && typeof window !== "undefined"
    ? `${window.location.origin}/share/${trip.shareToken}`
    : "";
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Share this trip</DialogTitle>
        <DialogDescription>
          Anyone with the link can view a read-only version. No login required.
        </DialogDescription>
      </DialogHeader>
      {trip.shareToken ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
            <Button
              type="button"
              variant="outline"
              onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied"); }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={onRevoke} disabled={revoking}>
              <Link2Off className="h-4 w-4 mr-2" /> {revoking ? "Revoking…" : "Revoke link"}
            </Button>
          </DialogFooter>
        </div>
      ) : (
        <DialogFooter>
          <Button onClick={onEnable} disabled={enabling}>
            <Share2 className="h-4 w-4 mr-2" /> {enabling ? "Generating…" : "Create share link"}
          </Button>
        </DialogFooter>
      )}
    </DialogContent>
  );
}

function TripPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => api<{ trip: Trip }>(`/api/trips/${id}`).then((r) => r.trip),
  });

  const [itinerary, setItinerary] = useState<DayPlan[]>([]);
  const [dirty, setDirty] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (data) {
      setItinerary(data.itinerary.map((d) => ({ day: d.day, activities: [...d.activities] })));
      setDirty(false);
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () =>
      api<{ trip: Trip }>(`/api/trips/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ itinerary }),
      }),
    onSuccess: (r) => {
      qc.setQueryData(["trip", id], r.trip);
      setDirty(false);
      toast.success("Itinerary saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const regenMut = useMutation({
    mutationFn: (day: number) =>
      api<{ trip: Trip }>(`/api/trips/${id}/regenerate-day`, {
        method: "POST",
        body: JSON.stringify({ day }),
      }),
    onSuccess: (r) => {
      qc.setQueryData(["trip", id], r.trip);
      toast.success("Day regenerated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const shareMut = useMutation({
    mutationFn: () => api<{ shareToken: string }>(`/api/trips/${id}/share`, { method: "POST" }),
    onSuccess: (r) => {
      qc.setQueryData(["trip", id], (prev: Trip | undefined) => prev ? { ...prev, shareToken: r.shareToken } : prev);
      toast.success("Share link enabled");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const revokeMut = useMutation({
    mutationFn: () => api(`/api/trips/${id}/share`, { method: "DELETE" }),
    onSuccess: () => {
      qc.setQueryData(["trip", id], (prev: Trip | undefined) => prev ? { ...prev, shareToken: null } : prev);
      toast.success("Share link revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-12 text-center max-w-md mx-auto">
        <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 font-semibold">Trip not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "It may have been deleted."}
        </p>
        <Button asChild className="mt-4"><Link to="/dashboard">Back to dashboard</Link></Button>
      </div>
    );
  }

  const t = data;
  const budgetItems = [
    { label: "Flights", value: t.budgetEstimate.flights, icon: Plane },
    { label: "Accommodation", value: t.budgetEstimate.accommodation, icon: Hotel },
    { label: "Food", value: t.budgetEstimate.food, icon: Utensils },
    { label: "Activities", value: t.budgetEstimate.activities, icon: Ticket },
  ];

  function updateActivity(dayIdx: number, actIdx: number, value: string) {
    setItinerary((prev) => {
      const next = prev.map((d) => ({ ...d, activities: [...d.activities] }));
      next[dayIdx].activities[actIdx] = value;
      return next;
    });
    setDirty(true);
  }
  function addActivity(dayIdx: number) {
    setItinerary((prev) => {
      const next = prev.map((d) => ({ ...d, activities: [...d.activities] }));
      next[dayIdx].activities.push("");
      return next;
    });
    setDirty(true);
  }
  function removeActivity(dayIdx: number, actIdx: number) {
    setItinerary((prev) => {
      const next = prev.map((d) => ({ ...d, activities: [...d.activities] }));
      next[dayIdx].activities.splice(actIdx, 1);
      return next;
    });
    setDirty(true);
  }

  function exportPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = margin;
    const line = (text: string, size = 11, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const wrapped = doc.splitTextToSize(text, pageW - margin * 2);
      for (const w of wrapped) {
        if (y > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(w, margin, y);
        y += size + 4;
      }
    };
    line(t.destination, 22, true);
    line(`${t.days} days · ${t.travelMonth} · ${t.travelStyle} · ${t.budgetType} budget`, 11);
    line(`Interests: ${t.interests.join(", ")}`, 11);
    if (t.weather) line(`Weather (avg): ${t.weather.tempHighC}°C / ${t.weather.tempLowC}°C · ${t.weather.precipitationMm}mm`, 11);
    y += 8;
    line("Budget estimate (USD)", 14, true);
    for (const b of budgetItems) line(`  ${b.label}: $${b.value.toLocaleString()}`);
    line(`  Total: $${t.budgetEstimate.total.toLocaleString()}`, 12, true);
    y += 8;
    line("Itinerary", 14, true);
    for (const d of itinerary) {
      line(`Day ${d.day}`, 12, true);
      for (const a of d.activities) line(`  • ${a}`);
      y += 4;
    }
    y += 8;
    line("Hotel picks", 14, true);
    for (const h of t.hotels) line(`  ${h.name} — ${h.rating} — ${h.priceRange}`);
    doc.save(`${t.destination.replace(/\s+/g, "-")}-itinerary.pdf`);
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Link>
      </Button>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
            <MapPin className="h-7 w-7 text-primary" /> {t.destination}
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> {t.days} days · {t.travelMonth} · {t.travelStyle}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {t.interests.map((i) => <Badge key={i} variant="secondary">{i}</Badge>)}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={exportPdf} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" /> Export PDF
        </Button>
        <Button
          onClick={() => saveMut.mutate()}
          size="sm"
          disabled={!dirty || saveMut.isPending}
        >
          <Save className="h-4 w-4 mr-2" /> {saveMut.isPending ? "Saving..." : "Save changes"}
        </Button>
        <Dialog open={shareOpen} onOpenChange={setShareOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
          </DialogTrigger>
          <ShareDialogContent
            trip={t}
            onEnable={() => shareMut.mutate()}
            onRevoke={() => revokeMut.mutate()}
            enabling={shareMut.isPending}
            revoking={revokeMut.isPending}
          />
        </Dialog>
      </div>

      {t.weather && (
        <section className="mt-8 rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <CloudSun className="h-4 w-4" /> Weather insights for {t.travelMonth}
          </h2>
          <p className="mt-2 text-sm">
            Expect highs around <strong>{t.weather.tempHighC}°C</strong> and lows around{" "}
            <strong>{t.weather.tempLowC}°C</strong>, with roughly{" "}
            <strong>{t.weather.precipitationMm}mm</strong> of precipitation. Itinerary is tuned to match.
          </p>
        </section>
      )}

      {t.coords && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold flex items-center gap-2"><MapPin className="h-5 w-5 text-accent" /> Map</h2>
          <div className="mt-4 overflow-hidden rounded-xl border bg-card">
            <iframe
              title={`Map of ${t.destination}`}
              className="w-full h-80 border-0"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${t.coords.lng - 0.15},${t.coords.lat - 0.1},${t.coords.lng + 0.15},${t.coords.lat + 0.1}&layer=mapnik&marker=${t.coords.lat},${t.coords.lng}`}
            />
            <div className="p-3 text-xs text-muted-foreground flex justify-between">
              <span>© OpenStreetMap contributors</span>
              <a
                className="text-primary hover:underline"
                href={`https://www.openstreetmap.org/?mlat=${t.coords.lat}&mlon=${t.coords.lng}#map=12/${t.coords.lat}/${t.coords.lng}`}
                target="_blank" rel="noreferrer"
              >Open larger map</a>
            </div>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Wallet className="h-5 w-5 text-accent" /> Budget</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {budgetItems.map((b) => (
            <div key={b.label} className="rounded-xl border bg-card p-4">
              <b.icon className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-2">{b.label}</p>
              <p className="text-lg font-semibold">${b.value.toLocaleString()}</p>
            </div>
          ))}
          <div className="rounded-xl border bg-primary p-4 text-primary-foreground">
            <p className="text-xs opacity-80">Total</p>
            <p className="text-2xl font-bold">${t.budgetEstimate.total.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Itinerary</h2>
        <div className="mt-4 space-y-4">
          {itinerary.map((d, dayIdx) => (
            <div key={d.day} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-lg">Day {d.day}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => regenMut.mutate(d.day)}
                  disabled={regenMut.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${regenMut.isPending ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              </div>
              <ul className="mt-3 space-y-2">
                {d.activities.map((a, actIdx) => (
                  <li key={actIdx} className="flex gap-2 items-start">
                    <span className="mt-3 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <Input
                      value={a}
                      onChange={(e) => updateActivity(dayIdx, actIdx, e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeActivity(dayIdx, actIdx)}
                      aria-label="Remove activity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => addActivity(dayIdx)}
              >
                <Plus className="h-4 w-4 mr-1" /> Add activity
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Hotel className="h-5 w-5 text-accent" /> Hotel picks</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {t.hotels.map((h, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">{h.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {h.rating}
              </p>
              <p className="text-sm mt-2">{h.priceRange}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}