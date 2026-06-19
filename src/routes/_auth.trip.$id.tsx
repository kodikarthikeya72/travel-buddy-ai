import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type Trip } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Plane, Hotel, Wallet, Utensils, Ticket, Star } from "lucide-react";

export const Route = createFileRoute("/_auth/trip/$id")({
  head: () => ({ meta: [{ title: "Trip — Wayfare" }] }),
  component: TripPage,
});

function TripPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => api<{ trip: Trip }>(`/api/trips/${id}`).then((r) => r.trip),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Trip not found.</p>
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
          {t.itinerary.map((d) => (
            <div key={d.day} className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-lg">Day {d.day}</h3>
              <ul className="mt-3 space-y-2">
                {d.activities.map((a, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-sm">{a}</span>
                  </li>
                ))}
              </ul>
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