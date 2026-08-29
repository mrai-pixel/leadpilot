import { useEffect, useState } from "react";
import api from "@/lib/api";
import { scoreColor, fmtTime } from "@/components/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhoneOff, Sparkles, FileText } from "lucide-react";

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [sel, setSel] = useState(null);

  useEffect(() => { api.get("/calls").then((r) => setCalls(r.data)); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-head text-3xl font-bold tracking-tight">Calls</h1>
        <p className="mt-1 text-muted-foreground">{calls.length} AI sales calls · Demo Call Mode</p>
      </div>

      {calls.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-20 text-center">
          <PhoneOff className="h-8 w-8 text-muted-foreground" />
          <div className="font-semibold">No calls yet</div>
          <div className="text-sm text-muted-foreground">Your AI Sales Employee will log calls here.</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  {["Lead", "Date", "Duration", "Outcome", "Lead Score"].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody data-testid="calls-table">
                {calls.map((c) => (
                  <tr key={c.id} onClick={() => setSel(c)} data-testid={`call-row-${c.id}`} className="cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 font-semibold">{c.lead_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtTime(c.created_at)}</td>
                    <td className="px-4 py-3 font-mono">{Math.floor(c.duration / 60)}m {c.duration % 60}s</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.outcome}</td>
                    <td className={`px-4 py-3 font-head font-bold ${scoreColor(c.score)}`}>{c.score}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-lg border-border bg-card" data-testid="call-detail-modal">
          <DialogHeader><DialogTitle className="font-head">Call Summary — {sel?.lead_name}</DialogTitle></DialogHeader>
          {sel && (
            <div className="space-y-4">
              <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3 text-sm">
                <div className="flex items-center gap-1.5 text-blue-300"><Sparkles className="h-3.5 w-3.5" /> Summary</div>
                <div className="mt-1 text-blue-50/90">{sel.summary}</div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><FileText className="h-4 w-4 text-muted-foreground" /> Transcript</div>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {sel.transcript?.map((t, i) => (
                    <div key={i} className={`flex ${t.speaker === "AI" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${t.speaker === "AI" ? "bg-blue-500/10 border border-blue-500/20 text-blue-50" : "bg-secondary"}`}>
                        {t.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-border bg-secondary/30 p-3">
                  <div className="text-xs text-muted-foreground">Outcome</div>
                  <div className="mt-0.5 font-semibold">{sel.outcome}</div>
                </div>
                <div className="rounded-md border border-border bg-secondary/30 p-3">
                  <div className="text-xs text-muted-foreground">Lead Score</div>
                  <div className={`mt-0.5 font-head font-bold ${scoreColor(sel.score)}`}>{sel.score}/100</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
