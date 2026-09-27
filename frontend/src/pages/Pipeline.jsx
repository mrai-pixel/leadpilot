import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { scoreColor } from "@/components/shared";
import { toast } from "sonner";

const COLUMNS = ["NEW", "CONTACTED", "ENGAGED", "QUALIFIED", "APPOINTMENT", "WON", "LOST"];
const COL_ACCENT = {
  NEW: "border-t-zinc-400", CONTACTED: "border-t-sky-500", ENGAGED: "border-t-indigo-500",
  QUALIFIED: "border-t-amber-500", APPOINTMENT: "border-t-orange-600", WON: "border-t-emerald-500", LOST: "border-t-red-500",
};

export default function Pipeline() {
  const [leads, setLeads] = useState([]);
  const [dragId, setDragId] = useState(null);
  const navigate = useNavigate();

  const load = () => api.get("/leads").then((r) => setLeads(r.data));
  useEffect(() => { load(); }, []);

  const onDrop = async (status) => {
    if (!dragId) return;
    const lead = leads.find((l) => l.id === dragId);
    setDragId(null);
    if (!lead || lead.status === status) return;
    setLeads((prev) => prev.map((l) => (l.id === dragId ? { ...l, status } : l)));
    try {
      await api.put(`/leads/${dragId}/stage`, { status });
      toast.success(`${lead.name} moved to ${status}`);
    } catch {
      toast.error("Could not update stage");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl uppercase tracking-tight">Pipeline</h1>
        <p className="mt-1 text-zinc-600">Drag leads across stages · updates the CRM instantly.</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
        {COLUMNS.map((col) => {
          const items = leads.filter((l) => l.status === col);
          return (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col)}
              data-testid={`kanban-col-${col}`}
              className={`flex w-64 shrink-0 flex-col rounded-lg border border-zinc-200 border-t-2 ${COL_ACCENT[col]} bg-zinc-50`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{col}</span>
                <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="flex-1 space-y-2 px-2 pb-3">
                {items.length === 0 && <div className="px-2 py-6 text-center text-xs text-muted-foreground">No leads</div>}
                {items.map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onClick={() => navigate(`/app/leads/${l.id}`)}
                    data-testid={`kanban-card-${l.id}`}
                    className="cursor-grab rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40 active:cursor-grabbing"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{l.name}</span>
                      <span className={`font-head text-sm font-bold ${scoreColor(l.lead_score)}`}>{l.lead_score}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{l.budget || "—"} · {l.requirement || "—"}</div>
                    <div className="mt-1.5 text-[11px] font-medium text-primary">{l.next_action}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
