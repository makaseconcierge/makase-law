import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Inbox, ChevronRight, RefreshCw, Scale } from "lucide-react";
import { API_URL, type MatterSummary } from "@/lib/api";
import { caseDisplayName } from "@/lib/matter-display";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-600 border-blue-200",
  filed: "bg-green-500/10 text-green-700 border-green-200",
  closed: "bg-muted text-muted-foreground border-border",
};

export function MattersPage() {
  const [, navigate] = useLocation();
  const [matters, setMatters] = useState<MatterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/matters`);
      setMatters(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatters();
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">Matters</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            All active probate matters and their submitted forms.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchMatters} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && matters.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading matters…</span>
        </div>
      ) : matters.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
          <Inbox className="h-10 w-10" />
          <span className="text-sm">No matters yet.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {matters.map((m) => (
            <Card
              key={m.id}
              className="cursor-pointer transition-colors hover:bg-muted/40"
              onClick={() => navigate(`/matters/${m.id}`)}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex flex-col gap-1">
                  <span className="font-medium leading-tight">
                    {caseDisplayName(m.data as Record<string, unknown>) ||
                      "Untitled Matter"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[m.status] ?? STATUS_COLORS.closed}`}
                  >
                    {m.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
