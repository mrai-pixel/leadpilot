import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScoreMeter, scoreColor, StatusBadge, TempBadge, fmtTime } from "@/components/shared";
import { ArrowLeft, Printer, Radar, Sparkles, CheckCircle2 } from "lucide-react";

function Field({ label, value }) {
  return (
    <div className="border border-zinc-200 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</div>
      <div className="mt-0.5 font-semibold text-zinc-900">{value || "—"}</div>
    </div>
  );
}

export default function ReportCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [d, setD] = useState(null);

  useEffect(() => { api.get(`/leads/${id}`).then((r) => setD(r.data)); }, [id]);

  if (!d) return <div className="p-10 text-zinc-500">Loading report…</div>;
  const l = d.lead;
  const call = d.calls[0];
  const appt = d.appointments[0];
  const fup = d.followups[0];

  const nextSteps = [
    appt ? `Attend the ${appt.type} on ${appt.day} at ${appt.time} (${appt.date}).` : "Book a site visit with the buyer.",
    fup ? fup.message : "Send property details and follow up.",
    l.temperature === "HOT" ? "Prioritise — hot lead, contact within 24 hours." : "Nurture and re-engage before the next call.",
  ];

  return (
    <div className="min-h-screen bg-zinc-100 py-8 print:bg-white print:py-0">
      {/* toolbar (hidden on print) */}
      <div className="mx-auto mb-6 flex max-w-3xl items-center justify-between px-4 print:hidden">
        <button onClick={() => navigate(`/app/leads/${id}`)} data-testid="report-back" className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Back to lead
        </button>
        <Button onClick={() => window.print()} data-testid="print-report-btn" className="gap-2 bg-orange-600 text-white hover:bg-orange-700">
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </Button>
      </div>

      {/* the report sheet */}
      <div className="mx-auto max-w-3xl bg-white p-8 shadow-lg print:max-w-none print:p-0 print:shadow-none sm:p-12" data-testid="report-sheet">
        {/* header */}
        <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-600 text-white">
                <Radar className="h-4 w-4" />
              </div>
              <span className="font-display text-lg tracking-tight">LEADPILOT</span>
            </div>
            <h1 className="mt-3 font-display text-3xl uppercase tracking-tight text-zinc-950">AI Call Report</h1>
          </div>
          <div className="text-right text-xs text-zinc-500">
            <div className="inline-block border border-orange-200 bg-orange-50 px-2 py-0.5 font-mono font-bold uppercase tracking-widest text-orange-700">Demo</div>
            <div className="mt-2">Generated {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
          </div>
        </div>

        {/* lead + score */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Lead</div>
            <div className="font-display text-3xl uppercase tracking-tight text-zinc-950">{l.name}</div>
            <div className="mt-2 flex items-center gap-3 text-sm text-zinc-600">
              <StatusBadge status={l.status} /> <TempBadge temp={l.temperature} />
              <span>{l.phone}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">AI Lead Score</div>
            <div className={`font-display text-5xl ${scoreColor(l.lead_score)}`}>{l.lead_score}<span className="text-2xl text-zinc-400">/100</span></div>
          </div>
        </div>
        <div className="mt-4"><ScoreMeter score={l.lead_score} size="lg" /></div>

        {l.score_breakdown?.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 text-sm font-bold text-zinc-900">Why this lead is {l.temperature}</div>
            <div className="grid grid-cols-2 gap-2">
              {l.score_breakdown.map((b, i) => (
                <div key={i} className="flex items-center justify-between border border-zinc-200 px-3 py-1.5 text-sm">
                  <span className="text-zinc-600">{b.label}</span>
                  <span className="font-mono font-bold text-emerald-600">+{b.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI summary */}
        {l.ai_summary && (
          <div className="mt-6 border border-orange-200 bg-orange-50 p-5">
            <div className="mb-1.5 flex items-center gap-2 text-sm font-bold text-orange-700"><Sparkles className="h-4 w-4" /> AI Lead Summary</div>
            <p className="text-sm leading-relaxed text-zinc-700">{l.ai_summary}</p>
          </div>
        )}

        {/* extracted info */}
        <div className="mt-6">
          <div className="mb-2 text-sm font-bold text-zinc-900">Qualified Information</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Field label="Budget" value={l.budget} />
            <Field label="Requirement" value={l.requirement} />
            <Field label="Location" value={l.location} />
            <Field label="Timeline" value={l.timeline} />
            <Field label="Financing" value={l.financing} />
            <Field label="Intent" value={l.intent} />
          </div>
        </div>

        {/* call + appointment */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="border border-zinc-200 p-4">
            <div className="text-sm font-bold text-zinc-900">Latest AI Call</div>
            {call ? (
              <div className="mt-1 space-y-0.5 text-sm text-zinc-600">
                <div>{fmtTime(call.created_at)} · {Math.floor(call.duration / 60)}m {call.duration % 60}s</div>
                <div>Outcome: <span className="text-zinc-900">{call.outcome}</span></div>
                <div>Score: <span className="text-zinc-900">{call.score}/100</span></div>
              </div>
            ) : <div className="mt-1 text-sm text-zinc-500">No call yet.</div>}
          </div>
          <div className="border border-zinc-200 p-4">
            <div className="text-sm font-bold text-zinc-900">Appointment</div>
            {appt ? (
              <div className="mt-1 space-y-0.5 text-sm text-zinc-600">
                <div className="text-zinc-900">{appt.type}</div>
                <div>{appt.day} · {appt.time} · {appt.date}</div>
                <div>Status: {appt.status}</div>
              </div>
            ) : <div className="mt-1 text-sm text-zinc-500">No appointment booked.</div>}
          </div>
        </div>

        {/* next steps */}
        <div className="mt-6">
          <div className="mb-2 text-sm font-bold text-zinc-900">Recommended Next Steps</div>
          <div className="space-y-2">
            {nextSteps.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" /> {s}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-200 pt-4 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          LeadPilot AI · Demo Call Mode — simulated call, no real telephony. Report for demonstration only.
        </div>
      </div>
    </div>
  );
}
