import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Scale, Building2, LogOut } from "lucide-react";
import { API_BASE, authHeaders } from "@/lib/api";
import supabase from "@/lib/supabase";

interface OnboardingPageProps {
  onComplete: () => void;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = name.trim().length > 0;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/offices`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create office");
      }
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Scale className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Law Office
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Set up your office to start managing matters and forms.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Create your office
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="office_name">Office name *</Label>
              <Input
                id="office_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Smith & Associates"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) handleCreate();
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="office_phone">Phone</Label>
              <Input
                id="office_phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="office_email">Email</Label>
              <Input
                id="office_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="office@example.com"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              className="mt-2"
              disabled={!canSubmit || submitting}
              onClick={handleCreate}
            >
              {submitting && <LoadingSpinner className="mr-2 h-4 w-4" />}
              Create Office
            </Button>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="mr-1 h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
