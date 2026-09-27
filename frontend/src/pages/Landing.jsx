import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Radar, Phone, Target, Star, CalendarCheck, Bell, RefreshCw, ArrowRight,
  Clock, AlertTriangle, Sparkles, Building2, MapPin, Timer,
} from "lucide-react";
import { toast } from "sonner";

const HERO_IMG = "https://images.unsplash.com/photo-1667584523543-d1d9cc828a15?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";
const TOWER_IMG = "https://images.unsplash.com/photo-1762758731316-419c3c283ed9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

const STEPS = [
  { icon: Phone, label: "Called in 30 seconds" },
  { icon: Target, label: "Qualified in language" },
  { icon: Star, label: "Scored 0–100" },
  { icon: CalendarCheck, label: "Site visit booked" },
  { icon: RefreshCw, label: "CRM updated" },
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
  { icon: Clock, t: "Leads aren't called fast", d: "Speed-to-lead decides who wins the deal." },
  { icon: Bell, t: "Follow-ups get forgotten", d: "Most revenue is lost in the follow-up gap." },
  { icon: RefreshCw, t: "CRM data goes stale", d: "Reps hate updating the CRM, so it rots." },
  { icon: AlertTriangle, t: "Hot prospects go cold", d: "The best leads die sitting in a queue." },
];

const FAQ = [
  ["Is this a real phone call?", "No — this is Demo Call Mode. The conversation is simulated so you can see the full workflow instantly. No real calls, SMS, WhatsApp or email are sent."],
  ["What does the AI actually do?", "It calls the lead, asks qualification questions, captures budget/timeline/requirement, scores the lead 0–100, books a site visit and creates a follow-up — then updates the CRM."],
  ["Does it replace my sales team?", "No. It feeds them. Closers close; the AI fills the site-visit calendar and keeps the CRM current."],
  ["How fast can I see it work?", "Under 30 seconds. Tap the demo, open a lead, press Start AI Call and watch the pipeline update itself."],
];

function SectionLabel({ n, children }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-mono text-xs font-bold tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 border border-orange-200">{n}</span>
      <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">{children}</span>
    </div>
  );
}

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
    <div className="min-h-screen bg-white text-zinc-950">
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-600 text-white">
              <Radar className="h-4 w-4" />
            </div>
            <span className="font-display text-lg tracking-tight">LEADPILOT</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-950">Sign in</Link>
            <Button onClick={tryDemo} data-testid="nav-try-demo" className="bg-orange-600 text-white hover:bg-orange-700">
              Try the demo
            </Button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="border-b border-zinc-200">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 border border-orange-200 bg-orange-50 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-orange-700">
              <span className="h-2 w-2 rounded-full bg-orange-500" /> The AI Sales Employee · Demo
            </div>
            <h1 className="font-display text-5xl uppercase leading-[0.92] tracking-tight sm:text-6xl lg:text-7xl">
              Every lead.<br />Called, qualified<br />&amp; booked.<br />
              <span className="text-orange-600">Automatically.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-zinc-600">
              Your AI Sales Employee calls every lead in seconds, qualifies budget and timeline, scores
              them, and books the site visit straight into your CRM.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={tryDemo} data-testid="hero-try-demo" size="lg" className="gap-2 bg-orange-600 text-white hover:bg-orange-700">
                <Sparkles className="h-4 w-4" /> Try the AI Sales Demo
              </Button>
              <a href="#how">
                <Button size="lg" variant="outline" className="border-zinc-300 text-zinc-900 hover:border-zinc-900">See How It Works</Button>
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-widest text-zinc-400">
              <span>Built for real-estate sales teams</span>
              <span className="hidden h-3 w-px bg-zinc-300 sm:block" />
              <span>Demo · UrbanNest Realty, Gurgaon</span>
            </div>
          </div>

          {/* hero visual: light call console */}
          <div className="relative">
            <img src={HERO_IMG} alt="Premium apartment interior" className="mb-4 h-40 w-full rounded-lg border border-zinc-200 object-cover" />
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div className="font-mono text-[11px] font-semibold uppercase tracking-widest text-zinc-500">AI Sales Call</div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                  <span className="h-2 w-2 rounded-full bg-orange-500 pulse-ring" /> Connected
                </div>
              </div>
              <div className="space-y-3 py-4 text-sm">
                <div className="max-w-[85%] rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-orange-950">
                  Hi Rahul, you enquired about our 3BHK in Gurgaon. Is now a good time?
                </div>
                <div className="ml-auto max-w-[70%] rounded-lg bg-zinc-100 px-3 py-2">Yes, sure.</div>
                <div className="max-w-[85%] rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-orange-950">
                  Would you like a site visit this Saturday at 11:30 AM?
                </div>
                <div className="ml-auto max-w-[70%] rounded-lg bg-zinc-100 px-3 py-2">Yes, that works.</div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <span className="text-sm font-semibold text-emerald-700">Qualified · Site visit booked</span>
                <span className="font-display text-2xl text-emerald-600">91/100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* problem */}
      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <SectionLabel n="01">The first-call problem</SectionLabel>
          <h2 className="max-w-3xl font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-5xl">
            You don&apos;t have a leads problem.<br /><span className="text-orange-600">You have a first-call problem.</span>
          </h2>
          <p className="mt-4 max-w-lg text-zinc-600">Every hour you wait, another buyer books with the agent who called first.</p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROBLEMS.map((p) => (
              <div key={p.t} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <p.icon className="h-5 w-5 text-orange-600" />
                <div className="mt-4 font-bold tracking-tight">{p.t}</div>
                <div className="mt-1 text-sm text-zinc-600">{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <SectionLabel n="02">The machine</SectionLabel>
          <h2 className="max-w-3xl font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-5xl">
            One lead in.<br />One booked site visit out.
          </h2>
          <div className="mt-12 flex flex-col items-stretch gap-3 md:flex-row md:items-center">
            <div className="rounded-lg border border-orange-300 bg-orange-50 px-5 py-4 text-center">
              <div className="font-bold text-orange-700">Portal lead</div>
            </div>
            {STEPS.map((s) => (
              <div key={s.label} className="flex items-center gap-3 md:flex-col md:gap-3">
                <ArrowRight className="h-5 w-5 shrink-0 rotate-90 text-zinc-400 md:rotate-0" />
                <div className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-4 text-center shadow-sm">
                  <s.icon className="mx-auto h-5 w-5 text-orange-600" />
                  <div className="mt-2 text-sm font-semibold">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm text-zinc-600">
            A visit counts only when it&apos;s real: confirmed budget range, a clear timeline, a matching
            requirement and a picked slot. The CRM reflects exactly what the AI did.
          </p>
        </div>
      </section>

      {/* live console */}
      <section className="border-b border-zinc-200">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-24">
          <div>
            <SectionLabel n="03">Live call console</SectionLabel>
            <h2 className="font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-5xl">
              Don&apos;t take our word for it. Watch the AI work.
            </h2>
            <p className="mt-4 max-w-md text-zinc-600">
              Open the demo, pick a lead and press Start AI Call. Watch the conversation play out, the
              score land, and the site visit book itself — in under 30 seconds.
            </p>
            <div className="mt-8 space-y-3">
              {[["01 · Budget", "Captures the buyer's investment range"], ["02 · Timeline", "Learns when they plan to buy"], ["03 · Slot offer", "Offers a real site-visit time"]].map(([a, b]) => (
                <div key={a} className="flex items-start gap-3 border-l-2 border-orange-200 pl-4">
                  <div>
                    <div className="font-mono text-xs font-bold uppercase tracking-widest text-orange-700">{a}</div>
                    <div className="text-sm text-zinc-600">{b}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={tryDemo} data-testid="console-try-demo" className="mt-8 gap-2 bg-zinc-900 text-white hover:bg-zinc-800">
              Talk to the AI in the demo <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-lg">
            <img src={TOWER_IMG} alt="Modern residential tower" className="h-56 w-full object-cover" />
            <div className="grid grid-cols-3 divide-x divide-zinc-200 border-t border-zinc-200">
              {[[Building2, "3BHK"], [MapPin, "Gurgaon"], [Timer, "30 days"]].map(([Icon, t], i) => (
                <div key={i} className="flex flex-col items-center gap-1 bg-white py-4">
                  <Icon className="h-4 w-4 text-orange-600" />
                  <span className="text-xs font-semibold">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <SectionLabel n="04">What the engine does</SectionLabel>
          <h2 className="font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-5xl">Everything your speed-to-lead problem needs.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-lg font-bold tracking-tight">{f.title}</div>
                <div className="mt-1 text-sm text-zinc-600">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* impact */}
      <section className="border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionLabel n="05">The outcome</SectionLabel>
              <h2 className="font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-5xl">Business impact.</h2>
            </div>
            <span className="border border-orange-200 bg-orange-50 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-orange-700">Demo / Estimated Results</span>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["127 hrs", "estimated time saved"],
              ["87", "leads auto-contacted"],
              ["143", "follow-ups automated"],
              ["₹18.4L", "estimated pipeline"],
            ].map(([v, l]) => (
              <div key={l} className="bg-white p-8">
                <div className="font-display text-4xl text-orange-600">{v}</div>
                <div className="mt-2 text-sm text-zinc-600">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* faq */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-4xl px-6 py-20 lg:py-24">
          <SectionLabel n="06">The questions</SectionLabel>
          <h2 className="font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-5xl">What decides whether this goes live.</h2>
          <div className="mt-12 divide-y divide-zinc-200 border-y border-zinc-200">
            {FAQ.map(([q, a], i) => (
              <div key={q} className="grid gap-2 py-6 md:grid-cols-[auto_1fr] md:gap-6">
                <span className="font-mono text-sm font-bold text-orange-600">0{i + 1}</span>
                <div>
                  <div className="text-lg font-bold tracking-tight">{q}</div>
                  <div className="mt-1 text-zinc-600">{a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center lg:py-32">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-orange-600 text-white">
          <Radar className="h-6 w-6" />
        </div>
        <h2 className="mx-auto max-w-3xl font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-6xl">
          Deploy your AI Sales Employee.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-zinc-600">
          Watch it call, qualify, score and book — in a live demo, in under 30 seconds.
        </p>
        <Button onClick={tryDemo} data-testid="cta-try-demo" size="lg" className="mt-8 gap-2 bg-orange-600 text-white hover:bg-orange-700">
          <Sparkles className="h-4 w-4" /> Try the AI Sales Demo
        </Button>
      </section>

      <footer className="border-t border-zinc-200 py-8 text-center font-mono text-xs uppercase tracking-widest text-zinc-400">
        © 2026 LeadPilot AI · Your AI Sales Employee · Demo environment
      </footer>
    </div>
  );
}
