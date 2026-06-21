import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User as UserIcon, KeyRound } from "lucide-react";

export const Route = createFileRoute("/_auth/profile")({
  head: () => ({ meta: [{ title: "Profile — Wayfare" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateName, changePassword } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    try {
      await updateName(name.trim());
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPw(true);
    try {
      await changePassword(current, next);
      toast.success("Password changed");
      setCurrent("");
      setNext("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Link>
      </Button>
      <h1 className="text-3xl font-bold">Your profile</h1>
      <p className="text-muted-foreground mt-1">Manage your account details.</p>

      <section className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="font-semibold flex items-center gap-2"><UserIcon className="h-4 w-4 text-primary" /> Account</h2>
        <form onSubmit={saveName} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
          </div>
          <Button type="submit" disabled={savingName || !name.trim() || name === user?.name}>
            {savingName ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </section>

      <section className="mt-6 rounded-xl border bg-card p-6">
        <h2 className="font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> Change password</h2>
        <form onSubmit={savePassword} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">Current password</Label>
            <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="next">New password</Label>
            <Input id="next" type="password" minLength={6} value={next} onChange={(e) => setNext(e.target.value)} required />
          </div>
          <Button type="submit" disabled={savingPw || !current || next.length < 6}>
            {savingPw ? "Updating…" : "Update password"}
          </Button>
        </form>
      </section>
    </div>
  );
}