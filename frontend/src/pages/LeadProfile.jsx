import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatusBadge, TempBadge, ScoreMeter, scoreColor, fmtTime } from "@/components/shared";
import AICallModal from "@/components/AICallModal";
import {
  ArrowLeft, Phone, Sparkles, Calendar, Bell, FileText, IndianRupee,
  Home, MapPin, Clock, Landmark, Zap, PhoneCall, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-semibold">{value || "—"}</div>
    </div>
  );
}

export default function LeadProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [callOpen, setCallOpen] = useState(false);
  const [transcriptCall, setTranscriptCall] = useState(null);

  const load = () => api.get(`/leads/${id}`).then((r) => setD(r.data));
  useEffect(() => { load(); }, [id]);

  if (!d) return <div className="text-muted-foreground">Loading lead…</div>;
  const l = d.lead;

  const onCallComplete = () => { load(); };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/app/leads")} data-testid="back-to-leads" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Leads
      </button>

      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-head text-3xl font-bold tracking-tight">{l.name}</h1>
            <StatusBadge status={l.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><PhoneCall className="h-3.5 w-3.5" /> {l.phone || "—"}</span>
            <span>{l.email}</span>
            <span>· {l.source}</span>
          </div>
          <div className="mt-3">
            {l.temperature === "HOT" && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1 text-sm font-bold text-red-400">
                <Zap className="h-4 w-4" /> HOT LEAD
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => setCallOpen(true)} data-testid="start-ai-call-btn" size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-amber">
          <Phone className="h-5 w-5" /> Start AI Call
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* AI score */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">AI Lead Score</div>
                <div className={`font-head text-5xl font-bold ${scoreColor(l.lead_score)}`} data-testid="lead-score">
                  {l.lead_score}<span className="text-2xl text-muted-foreground">/100</span>
                </div>
              </div>
              <TempBadge temp={l.temperature} />
            </div>
            <div className="mt-4"><ScoreMeter score={l.lead_score} size="lg" /></div>
            {l.score_breakdown?.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-sm font-semibold">Why this lead is {l.temperature}</div>
                <div className="space-y-1.5" data-testid="score-breakdown">
                  {l.score_breakdown.map((b, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-1.5 text-sm">
                      <span className="text-muted-foreground">{b.label}</span>
                      <span className="font-mono font-bold text-emerald-400">+{b.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI summary */}
          {l.ai_summary && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-300">
                <Sparkles className="h-4 w-4" /> AI Lead Summary
              </div>
              <p className="text-sm leading-relaxed text-blue-50/90" data-testid="ai-summary">{l.ai_summary}</p>
            </div>
          )}

          {/* AI extracted info */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-head text-lg font-semibold">AI Extracted Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="extracted-info">
              <Info icon={IndianRupee} label="Budget" value={l.budget} />
              <Info icon={Home} label="Requirement" value={l.requirement} />
              <Info icon={MapPin} label="Location" value={l.location} />
              <Info icon={Clock} label="Timeline" value={l.timeline} />
              <Info icon={Landmark} label="Financing" value={l.financing} />
              <Info icon={Zap} label="Intent" value={l.intent} />
            </div>
          </div>

          {/* conversation history */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-head text-lg font-semibold">Conversation History</h3>
            </div>
            {d.calls.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No calls yet. Click <span className="text-primary">Start AI Call</span> to qualify this lead.
              </div>
            ) : (
              <div className="space-y-3" data-testid="conversation-history">
                {d.calls.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">AI Sales Call</div>
                        <div className="text-xs text-muted-foreground">
                          {fmtTime(c.created_at)} • {Math.floor(c.duration / 60)}m {c.duration % 60}s
                        </div>
                      </div>
                      <span className={`font-head font-bold ${scoreColor(c.score)}`}>{c.score}/100</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Outcome: <span className="text-foreground">{c.outcome}</span></span>
                      <Button variant="ghost" size="sm" onClick={() => setTranscriptCall(c)} data-testid={`view-transcript-${c.id}`} className="h-7 gap-1 text-xs text-primary hover:text-primary">
                        View Transcript
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* right column */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-head text-lg font-semibold">Appointments</h3>
            </div>
            {d.appointments.length === 0 ? (
              <div className="text-sm text-muted-foreground">No appointments yet.</div>
            ) : (
              <div className="space-y-3" data-testid="lead-appointments">
                {d.appointments.map((a) => (
                  <div key={a.id} className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <div className="font-semibold">{a.type}</div>
                    <div className="text-sm text-muted-foreground">{a.day} · {a.time} · {a.date}</div>
                    <span className="mt-1 inline-block rounded bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-head text-lg font-semibold">Next Follow-up</h3>
            </div>
            {d.followups.length === 0 ? (
              <div className="text-sm text-muted-foreground">No follow-ups scheduled.</div>
            ) : (
              <div className="space-y-3" data-testid="lead-followups">
                {d.followups.map((f) => (
                  <div key={f.id} className="rounded-lg border border-border bg-secondary/30 p-3">
                    <div className="text-sm">{f.message}</div>
                    <span className="mt-1 inline-block rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">{f.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AICallModal open={callOpen} lead={l} onClose={() => setCallOpen(false)} onComplete={onCallComplete} />

      {/* transcript dialog */}
      <Dialog open={!!transcriptCall} onOpenChange={(o) => !o && setTranscriptCall(null)}>
        <DialogContent className="max-w-lg border-border bg-card" data-testid="transcript-modal">
          <DialogHeader><DialogTitle className="font-head">Call Transcript</DialogTitle></DialogHeader>
          {transcriptCall && (
            <>
              <div className="rounded-md border border-border bg-secondary/30 p-3 text-sm">
                <div className="text-muted-foreground">Summary</div>
                <div className="mt-1">{transcriptCall.summary}</div>
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {transcriptCall.transcript?.map((t, i) => (
                  <div key={i} className={`flex ${t.speaker === "AI" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${t.speaker === "AI" ? "bg-blue-500/10 border border-blue-500/20 text-blue-50" : "bg-secondary"}`}>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.speaker === "AI" ? "Alex · AI" : "Lead"}</div>
                      {t.text}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
