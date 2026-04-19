import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  FileText,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { API_URL, type MatterDetail, type FormSummary } from "@/lib/api";
import { caseDisplayName } from "@/lib/matter-display";

const FORM_LABELS: Record<string, string> = {
  de_111: "DE-111 — Petition for Probate",
  de_121: "DE-121 — Notice of Petition",
  de_140: "DE-140 — Order for Probate",
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-amber-500/10 text-amber-700 border-amber-200",
  reviewed: "bg-blue-500/10 text-blue-600 border-blue-200",
  filed: "bg-green-500/10 text-green-700 border-green-200",
  draft: "bg-muted text-muted-foreground border-border",
};

function FormCard({
  form,
  onClick,
}: {
  form: FormSummary;
  onClick: () => void;
}) {
  const fd = form.form_data as Record<string, string>;
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/40"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium leading-tight">
              {FORM_LABELS[form.form_type] ?? form.form_type}
            </span>
            {fd.petitioner_names && (
              <span className="text-sm text-muted-foreground">
                Petitioner: {fd.petitioner_names.split("\n")[0]}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[form.status] ?? STATUS_COLORS.draft}`}
          >
            {form.status}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(form.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MatterDetailPage() {
  const { matterId } = useParams<{ matterId: string }>();
  const [, navigate] = useLocation();
  const [matterData, setMatterData] = useState<MatterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayNameEdit, setDisplayNameEdit] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/matters/${matterId}`);
        if (!res.ok) throw new Error("not found");
        const row = await res.json();
        setMatterData(row);
        setDisplayNameEdit(
          caseDisplayName(row.data as Record<string, unknown>),
        );
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [matterId]);

  const saveDisplayName = async () => {
    if (!matterData || !matterId) return;
    setSavingName(true);
    setNameError("");
    try {
      const merged = {
        ...((matterData.data as Record<string, unknown>) ?? {}),
        display_name: displayNameEdit.trim(),
      };
      const res = await fetch(`${API_URL}/matters/${matterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: merged }),
      });
      if (!res.ok) throw new Error("save failed");
      setMatterData({ ...matterData, data: merged });
      setDisplayNameEdit(String(merged.display_name ?? "").trim());
    } catch {
      setNameError("Could not save.");
    } finally {
      setSavingName(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Loading matter…</span>
      </div>
    );
  }

  if (!matterData) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 text-center text-muted-foreground">
        Matter not found.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/matters")}
        className="mb-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        All matters
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            Matter title
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="matter_display_name">Display name</Label>
              <Input
                id="matter_display_name"
                value={displayNameEdit}
                onChange={(e) => setDisplayNameEdit(e.target.value)}
                placeholder="Name shown in your matter list"
              />
              <p className="text-xs text-muted-foreground">
                Editing this does not change names already loaded on court forms.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={saveDisplayName}
              disabled={
                savingName ||
                displayNameEdit.trim() ===
                  caseDisplayName(matterData.data as Record<string, unknown>)
              }
            >
              {savingName ? "Saving…" : "Save"}
            </Button>
          </div>
          {nameError && (
            <p className="text-xs text-destructive">{nameError}</p>
          )}
          <div className="flex gap-2">
            <span className="w-36 shrink-0 text-muted-foreground">Status</span>
            <span className="capitalize">{matterData.status}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-36 shrink-0 text-muted-foreground">Opened</span>
            <span>
              {new Date(matterData.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">
          Forms{" "}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            ({matterData.forms.length})
          </span>
        </h2>
      </div>
      <Separator className="mb-4" />

      {matterData.forms.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <Inbox className="h-8 w-8" />
          <span className="text-sm">No forms submitted for this matter yet.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {matterData.forms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              onClick={() =>
                navigate(`/forms/${form.form_type}/${form.id}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
