import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api, type Trip } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, MapPin, Calendar, Trash2, Search, Compass } from "lucide-react";

export const Route = createFileRoute("/_auth/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Wayfare" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["trips"],
    queryFn: () => api<{ trips: Trip[] }>("/api/trips").then((r) => r.trips),
  });

  const del = useMutation({
    mutationFn: (id: string) => api(`/api/trips/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Trip deleted");
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  const trips = (data ?? []).filter((t) =>
    t.destination.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name.split(" ")[0]}</h1>
          <p className="text-muted-foreground mt-1">Pick up where you left off or plan something new.</p>
        </div>
        <Button asChild size="lg">
          <Link to="/create-trip"><Plus className="h-4 w-4 mr-1" /> Create new trip</Link>
        </Button>
      </div>

      <div className="mt-8 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search destinations" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-1.5 pt-1">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-10" />
            </div>
            <Skeleton className="h-9 w-full mt-4" />
          </div>
        ))}

        {isError && !isLoading && (
          <div className="col-span-full rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="font-semibold">Couldn't load your trips</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Please try again."}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>Retry</Button>
          </div>
        )}

        {!isLoading && !isError && data && trips.length === 0 && q && (
          <div className="col-span-full rounded-xl border border-dashed bg-card p-12 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No matches for "{q}"</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try a different destination.</p>
            <Button variant="outline" className="mt-4" onClick={() => setQ("")}>Clear search</Button>
          </div>
        )}

        {!isLoading && !isError && data && data.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed bg-card p-12 text-center">
            <Compass className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">No trips yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create your first AI-planned trip.</p>
            <Button asChild className="mt-4"><Link to="/create-trip">Plan a trip</Link></Button>
          </div>
        )}

        {trips.map((t) => (
          <div key={t._id} className="rounded-xl border bg-card p-5 shadow-sm flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" /> {t.destination}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3.5 w-3.5" /> {t.days} days · {t.travelMonth}
                </p>
              </div>
              <Badge variant="secondary">{t.budgetType}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-1">
              {t.interests.slice(0, 4).map((i) => (
                <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
              ))}
            </div>
            <div className="mt-auto pt-5 flex gap-2">
              <Button asChild size="sm" className="flex-1">
                <Link to="/trip/$id" params={{ id: t._id }}>View</Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={del.isPending} aria-label="Delete trip">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
                    <AlertDialogDescription>
                      "{t.destination}" will be permanently removed. This can't be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => del.mutate(t._id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}