import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Radar, Phone, Target, Star, CalendarCheck, Bell, RefreshCw, ArrowRight,
  PhoneOff, Clock, AlertTriangle, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { icon: Phone, label: "AI calls" },
  { icon: Target, label: "AI qualifies" },
  { icon: Star, label: "AI scores" },
  { icon: CalendarCheck, label: "AI books" },
  { icon: RefreshCw, label: "CRM updates" },
];

const FEATURES = [
  { icon: Phone, title: "AI Calling", desc: "Every new lead is called within seconds, not hours." },
  { icon: Target, title: "Lead Qualification", desc: "Budget, timeline, requirement — captured automatically." },
  { icon: Star, title: "AI Lead Scoring", desc: "Explainable 0–100 scores so you work the hottest leads first." },
  { icon: CalendarCheck, title: "Appointment Booking", desc: "Site visits booked straight into the calendar." },
  { icon: Bell, title: "Automated Follow-up", desc: "No prospect ever slips through the cracks again." },
  { icon: RefreshCw, title: "CRM Automation", desc: "Pipeline stages update themselves after every call." },
];

const PROBLEMS = [
  { icon: Clock, t: "Leads aren't contacted quickly", d: "Speed-to-lead decides who wins the deal." },
  { icon: Bell, t: "Salespeople forget follow-ups", d: "Most revenue is lost in the follow-up gap." },
  { icon: RefreshCw, t: "CRM data is outdated", d: "Reps hate updating the CRM, so it rots." },
  { icon: AlertTriangle, t: "Hot prospects get lost", d: "The best leads go cold while sitting in a queue." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();

  const tryDemo = async () => {
    try {
      await demoLogin();
      navigate("/app");
    } catch {
      toast.error("Could not start demo");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Radar className="h-4 w-4" />
            </div>
            <span className="font-head text-lg font-bold">LeadPilot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
            <Button onClick={tryDemo} data-testid="nav-try-demo" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Try the demo
            </Button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:py-32">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> AI Sales Employee · Active
            </span>
            <h1 className="mt-6 font-head text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Your AI <span className="text-primary">Sales Employee</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Every lead gets contacted, qualified, followed up and converted — automatically.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={tryDemo} data-testid="hero-try-demo" size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Sparkles className="h-4 w-4" /> Try the AI Sales Demo
              </Button>
              <a href="#how">
                <Button size="lg" variant="outline" className="border-border">See How It Works</Button>
              </a>
            </div>
          </div>

          {/* hero visual: call card */}
          <div className="relative">
            <div className="rounded-xl border border-border bg-[#0a0a0a] p-5 glow-blue">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">AI Sales Call</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-ring" /> Connected
                </div>
              </div>
              <div className="space-y-3 py-4 text-sm">
                <div className="max-w-[85%] rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-blue-50">
                  Hi Rahul, you enquired about our 3BHK in Gurgaon. Is now a good time?
                </div>
                <div className="ml-auto max-w-[70%] rounded-lg bg-secondary px-3 py-2">Yes, sure.</div>
                <div className="max-w-[85%] rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-blue-50">
                  Would you like a site visit this Saturday at 11:30 AM?
                </div>
                <div className="ml-auto max-w-[70%] rounded-lg bg-secondary px-3 py-2">Yes, that works.</div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <span className="text-sm font-semibold text-emerald-300">Qualified · Site visit booked</span>
                <span className="font-head text-xl font-bold text-emerald-400">91/100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* problem */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="font-head text-3xl font-bold tracking-tight">The Problem</h2>
          <p className="mt-2 max-w-lg text-muted-foreground">Businesses lose leads every single day — not from lack of demand, but from lack of follow-through.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map((p) => (
              <div key={p.t} className="rounded-lg border border-border bg-card p-6">
                <p.icon className="h-5 w-5 text-red-400" />
                <div className="mt-4 font-semibold">{p.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="border-b border-border bg-[#070707]">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="font-head text-3xl font-bold tracking-tight">How LeadPilot Works</h2>
          <p className="mt-2 text-muted-foreground">A lead arrives → the AI handles everything → your CRM updates itself.</p>
          <div className="mt-12 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
            <div className="rounded-lg border border-primary/40 bg-primary/10 px-5 py-4 text-center">
              <div className="font-head font-bold text-primary">Lead arrives</div>
            </div>
            {STEPS.map((s) => (
              <div key={s.label} className="flex items-center gap-3 md:flex-col md:gap-3">
                <ArrowRight className="h-5 w-5 shrink-0 rotate-90 text-muted-foreground md:rotate-0" />
                <div className="flex-1 rounded-lg border border-border bg-card px-5 py-4 text-center">
                  <s.icon className="mx-auto h-5 w-5 text-blue-400" />
                  <div className="mt-2 text-sm font-semibold">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* features */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="font-head text-3xl font-bold tracking-tight">Features</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-head text-lg font-semibold">{f.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* impact */}
      <section className="border-b border-border bg-[#070707]">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="flex items-end justify-between">
            <h2 className="font-head text-3xl font-bold tracking-tight">Business Impact</h2>
            <span className="rounded bg-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Demo / Estimated Results</span>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["127 hrs", "estimated time saved"],
              ["87", "leads auto-contacted"],
              ["143", "follow-ups automated"],
              ["₹18.4L", "estimated pipeline"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg border border-border bg-card p-6">
                <div className="font-head text-3xl font-bold text-primary">{v}</div>
                <div className="mt-1 text-sm text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-28 text-center">
        <PhoneOff className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-6 font-head text-4xl font-bold tracking-tight">Deploy Your AI Sales Employee</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Watch it call, qualify, score and book — in a live demo, in under 30 seconds.
        </p>
        <Button onClick={tryDemo} data-testid="cta-try-demo" size="lg" className="mt-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Sparkles className="h-4 w-4" /> Try the AI Sales Demo
        </Button>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 LeadPilot AI · Your AI Sales Employee · Demo environment
      </footer>
    </div>
  );
}
