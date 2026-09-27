import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { scoreColor } from "@/components/shared";
import { Calendar, MapPin, Clock, CalendarX } from "lucide-react";

export default function Appointments() {
  const [appts, setAppts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { api.get("/appointments").then((r) => setAppts(r.data)); }, []);

  const grouped = appts.reduce((acc, a) => {
    (acc[a.day] = acc[a.day] || []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl uppercase tracking-tight">Appointments</h1>
        <p className="mt-1 text-zinc-600">Site visits booked by your AI Sales Employee.</p>
      </div>

      {appts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card py-20 text-center">
          <CalendarX className="h-8 w-8 text-muted-foreground" />
          <div className="font-semibold">No appointments yet</div>
          <div className="text-sm text-muted-foreground">Run an AI call to book a site visit automatically.</div>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" data-testid="appointments-list">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day} className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-head font-semibold">{day}</span>
                <span className="ml-auto rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-3 p-4">
                {items.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/app/leads/${a.lead_id}`)}
                    data-testid={`appt-${a.id}`}
                    className="cursor-pointer rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{a.lead_name}</span>
                      <span className={`font-head text-sm font-bold ${scoreColor(a.lead_score)}`}>{a.lead_score}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {a.type} · {a.notes}</div>
                      <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {a.time} · {a.date}</div>
                    </div>
                    <span className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${a.status === "Confirmed" ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/15 text-primary"}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
