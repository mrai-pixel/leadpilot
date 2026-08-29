import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatusBadge, TempBadge, scoreColor, fmtTime } from "@/components/shared";
import {
  Users, Phone, MessageSquare, CheckCircle2, CalendarCheck, IndianRupee,
  Bot, ArrowRight, Flame, Target, Star, Bell, Clock,
} from "lucide-react";

const ACT_ICON = {
  qualified: { Icon: Flame, cls: "text-red-400" },
  call: { Icon: Phone, cls: "text-blue-400" },
  appointment: { Icon: CalendarCheck, cls: "text-primary" },
  followup: { Icon: Bell, cls: "text-amber-400" },
  score: { Icon: Star, cls: "text-emerald-400" },
};

const FUNNEL_COLORS = ["#3f3f46", "#3b82f6", "#6366f1", "#f59e0b", "#d97706", "#10b981"];

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 transition-transform hover:-translate-y-0.5" data-testid={`kpi-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 font-head text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/dashboard").then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="text-muted-foreground">Loading dashboard…</div>;

  const m = data.metrics;
  const maxFunnel = Math.max(...data.funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-8">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-head text-3xl font-bold tracking-tight">Good morning, UrbanNest 👋</h1>
          <p className="mt-1 text-muted-foreground">Here&apos;s what your AI Sales Employee accomplished today.</p>
        </div>
        <span className="rounded bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Demo Data</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={Users} label="New Leads" value={m.new_leads} />
        <Kpi icon={Phone} label="AI Calls" value={m.ai_calls} />
        <Kpi icon={MessageSquare} label="Conversations" value={m.conversations} />
        <Kpi icon={CheckCircle2} label="Qualified" value={m.qualified} />
        <Kpi icon={CalendarCheck} label="Appointments" value={m.appointments} />
        <Kpi icon={IndianRupee} label="Pipeline" value={m.pipeline} />
      </div>

      {/* AI Sales Employee card */}
      <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-[#120c02] to-[#0a0a0a] p-6 sm:p-8 glow-amber">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Bot className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-ring" /> Active
              </div>
              <h2 className="mt-1 font-head text-2xl font-bold tracking-tight">AI Sales Employee</h2>
              <p className="mt-1 text-muted-foreground">Your AI is working through today&apos;s leads.</p>
            </div>
          </div>
          <Button onClick={() => navigate("/app/agent")} data-testid="view-ai-activity-btn" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            View AI Activity <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* activity feed */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-head text-lg font-semibold">AI Activity Feed</h3>
          </div>
          <div className="space-y-4 border-l border-border pl-4" data-testid="activity-feed">
            {data.activities.map((a) => {
              const { Icon, cls } = ACT_ICON[a.type] || ACT_ICON.score;
              return (
                <div key={a.id} className="relative">
                  <span className={`absolute -left-[22px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-card ${cls}`}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="text-sm text-foreground">{a.description}</div>
                  <div className="text-[11px] text-muted-foreground">{fmtTime(a.created_at)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* funnel + hot leads */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-head text-lg font-semibold">Lead Funnel</h3>
            </div>
            <div className="space-y-2.5" data-testid="lead-funnel">
              {data.funnel.map((f, i) => (
                <div key={f.stage} className="flex items-center gap-4">
                  <div className="w-24 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.stage}</div>
                  <div className="h-8 flex-1 overflow-hidden rounded-md bg-secondary/40">
                    <div
                      className="flex h-full items-center justify-end rounded-md px-3 text-xs font-bold text-black transition-all"
                      style={{ width: `${Math.max((f.count / maxFunnel) * 100, 10)}%`, backgroundColor: FUNNEL_COLORS[i] }}
                    >
                      {f.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-5 flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-400" />
              <h3 className="font-head text-lg font-semibold">Hot Leads</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2" data-testid="hot-leads">
              {data.hot_leads.map((l) => (
                <div key={l.id} className="rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/40">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{l.name}</div>
                    <span className={`font-head text-lg font-bold ${scoreColor(l.lead_score)}`}>{l.lead_score}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <TempBadge temp={l.temperature} /> · {l.budget || "—"} · {l.requirement || "—"}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">{l.timeline ? `Buying in ${l.timeline}` : "Timeline TBD"}</div>
                  <div className="mt-1 text-xs font-medium text-primary">{l.next_action}</div>
                  <Button
                    variant="ghost" size="sm" onClick={() => navigate(`/app/leads/${l.id}`)}
                    data-testid={`hotlead-view-${l.id}`}
                    className="mt-2 h-7 gap-1 px-0 text-xs text-foreground hover:text-primary"
                  >
                    View Lead <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* impact panel */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-head text-xl font-bold tracking-tight">Business Impact</h3>
          <span className="rounded bg-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Demo / Estimated Results</span>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {[
            [`${m.hours_saved} hrs`, "estimated time saved"],
            [m.leads_contacted, "leads auto-contacted"],
            [m.followups, "follow-ups automated"],
            [m.appointments, "appointments booked"],
            [m.pipeline, "estimated pipeline"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="font-head text-2xl font-bold text-primary sm:text-3xl">{v}</div>
              <div className="mt-1 text-xs text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
