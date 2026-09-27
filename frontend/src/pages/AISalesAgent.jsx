import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export default function AISalesAgent() {
  const [agent, setAgent] = useState(null);

  const load = () => api.get("/agent").then((r) => setAgent(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await api.put("/agent", {
        tone: agent.tone, objective: agent.objective, questions: agent.questions, name: agent.name,
      });
      toast.success("Agent configuration saved");
    } catch {
      toast.error("Could not save configuration");
    }
  };

  if (!agent) return <div className="text-muted-foreground">Loading agent…</div>;

  const setQ = (i, v) => {
    const q = [...agent.questions]; q[i] = v; setAgent({ ...agent, questions: q });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-tight">AI Sales Agent</h1>
          <p className="mt-1 text-zinc-600">Configure how your AI Sales Employee qualifies and books.</p>
        </div>
        <span className="rounded bg-orange-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-700">Demo Call Mode</span>
      </div>

      {/* agent status card */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-orange-600 text-white">
            <Bot className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-ring" /> Active
            </div>
            <div className="mt-1 font-display text-xl uppercase tracking-tight">{agent.name}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h3 className="font-head text-lg font-semibold">Configuration</h3>
          <div>
            <Label className="text-xs">Agent Name</Label>
            <Input value={agent.name} onChange={(e) => setAgent({ ...agent, name: e.target.value })} data-testid="agent-name" className="mt-1 bg-secondary/40" />
          </div>
          <div>
            <Label className="text-xs">Tone</Label>
            <Input value={agent.tone} onChange={(e) => setAgent({ ...agent, tone: e.target.value })} data-testid="agent-tone" className="mt-1 bg-secondary/40" />
          </div>
          <div>
            <Label className="text-xs">Primary Objective</Label>
            <Input value={agent.objective} onChange={(e) => setAgent({ ...agent, objective: e.target.value })} data-testid="agent-objective" className="mt-1 bg-secondary/40" />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-head text-lg font-semibold">Qualification Questions</h3>
            <Button variant="ghost" size="sm" onClick={() => setAgent({ ...agent, questions: [...agent.questions, ""] })} data-testid="add-question-btn" className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="space-y-2" data-testid="agent-questions">
            {agent.questions.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{i + 1}.</span>
                <Input value={q} onChange={(e) => setQ(i, e.target.value)} data-testid={`agent-question-${i}`} className="bg-secondary/40" />
                <Button variant="ghost" size="icon" onClick={() => setAgent({ ...agent, questions: agent.questions.filter((_, j) => j !== i) })} className="shrink-0 text-muted-foreground hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={save} data-testid="save-agent-btn" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
        <Save className="h-4 w-4" /> Save Configuration
      </Button>
    </div>
  );
}
