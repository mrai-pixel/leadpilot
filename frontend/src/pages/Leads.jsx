import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, scoreColor, fmtTime } from "@/components/shared";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Upload, Users } from "lucide-react";
import { toast } from "sonner";

const FILTERS = ["All", "New", "Contacted", "Engaged", "Qualified", "Hot", "Warm", "Cold", "Appointment", "Won", "Lost"];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", source: "Website", budget: "", requirement: "", location: "Gurgaon", timeline: "" });
  const [csv, setCsv] = useState("name,phone,email,source,budget,requirement,timeline\nJohn Doe,+91 90000 00000,john@example.com,Website,₹1.8 Cr,3BHK,60 days");
  const navigate = useNavigate();

  const load = () => api.get("/leads").then((r) => setLeads(r.data));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const f = filter.toUpperCase();
      let ok = true;
      if (filter === "All") ok = true;
      else if (["HOT", "WARM", "COLD"].includes(f)) ok = l.temperature === f;
      else ok = l.status === f;
      if (ok && q) ok = `${l.name} ${l.email} ${l.phone} ${l.requirement}`.toLowerCase().includes(q.toLowerCase());
      return ok;
    });
  }, [leads, filter, q]);

  const addLead = async () => {
    if (!form.name) return toast.error("Name is required");
    try {
      await api.post("/leads", form);
      toast.success("Lead added");
      setAddOpen(false);
      setForm({ name: "", phone: "", email: "", source: "Website", budget: "", requirement: "", location: "Gurgaon", timeline: "" });
      load();
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    }
  };

  const importCsv = async () => {
    try {
      const { data } = await api.post("/leads/import", { csv_text: csv });
      toast.success(`Imported ${data.imported} lead(s)`);
      setImportOpen(false);
      load();
    } catch (e) {
      toast.error(apiError(e.response?.data?.detail));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-head text-3xl font-bold tracking-tight">Leads</h1>
          <p className="mt-1 text-muted-foreground">{leads.length} leads · managed by your AI Sales Employee</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} data-testid="import-csv-btn" className="gap-2 border-border">
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button onClick={() => setAddOpen(true)} data-testid="add-lead-btn" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Lead
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} data-testid="search-leads" placeholder="Search leads" className="bg-secondary/40 pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              data-testid={`filter-${f.toLowerCase()}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                {["Lead", "Source", "Status", "AI Score", "Budget", "Requirement", "Last Contact", "Next Action"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody data-testid="leads-table">
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => navigate(`/app/leads/${l.id}`)}
                  data-testid={`lead-row-${l.id}`}
                  className="cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary/30"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.source}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className={`px-4 py-3 font-head font-bold ${scoreColor(l.lead_score)}`}>{l.lead_score}</td>
                  <td className="px-4 py-3">{l.budget || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.requirement || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtTime(l.last_contact)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-primary">{l.next_action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div className="font-semibold">No leads yet</div>
            <div className="text-sm text-muted-foreground">Your AI Sales Employee will show activity here.</div>
            <Button onClick={() => setAddOpen(true)} className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90">Add your first lead</Button>
          </div>
        )}
      </div>

      {/* add lead */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-border bg-card" data-testid="add-lead-modal">
          <DialogHeader><DialogTitle className="font-head">Add Lead</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["name", "Name *"], ["phone", "Phone"], ["email", "Email"], ["source", "Source"],
              ["budget", "Budget"], ["requirement", "Requirement"], ["location", "Location"], ["timeline", "Timeline"],
            ].map(([k, label]) => (
              <div key={k} className={k === "name" ? "col-span-2" : ""}>
                <Label className="text-xs">{label}</Label>
                <Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} data-testid={`add-${k}`} className="mt-1 bg-secondary/40" />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={addLead} data-testid="add-lead-submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Add Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* import csv */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="border-border bg-card" data-testid="import-csv-modal">
          <DialogHeader><DialogTitle className="font-head">Import Leads (CSV)</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Paste CSV with a header row. Columns: name, phone, email, source, budget, requirement, timeline.</p>
          <textarea
            value={csv} onChange={(e) => setCsv(e.target.value)} data-testid="csv-textarea"
            className="h-40 w-full rounded-md border border-border bg-secondary/40 p-3 font-mono text-xs"
          />
          <DialogFooter>
            <Button onClick={importCsv} data-testid="import-csv-submit" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Upload className="h-4 w-4" /> Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
