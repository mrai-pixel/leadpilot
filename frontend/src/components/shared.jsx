// Shared small UI helpers for LeadPilot
import { Flame, Snowflake, Thermometer } from "lucide-react";

export const STATUS_STYLES = {
  NEW: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  CONTACTED: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  ENGAGED: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  QUALIFIED: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  APPOINTMENT: "bg-primary/20 text-primary border-primary/40",
  WON: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  LOST: "bg-red-500/15 text-red-300 border-red-500/30",
};

export function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.NEW;
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${cls}`}>
      {status}
    </span>
  );
}

export function TempBadge({ temp }) {
  const map = {
    HOT: { cls: "text-red-400", Icon: Flame, label: "HOT" },
    WARM: { cls: "text-amber-400", Icon: Thermometer, label: "WARM" },
    COLD: { cls: "text-sky-400", Icon: Snowflake, label: "COLD" },
  };
  const { cls, Icon, label } = map[temp] || map.COLD;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

export function scoreColor(score) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 55) return "text-amber-400";
  return "text-sky-400";
}

export function ScoreMeter({ score, size = "md" }) {
  const segments = 10;
  const active = Math.round((score / 100) * segments);
  const barH = size === "lg" ? "h-8" : "h-4";
  const color = (i) => {
    if (i >= active) return "bg-zinc-800";
    const ratio = score / 100;
    if (ratio >= 0.8) return "bg-emerald-500";
    if (ratio >= 0.55) return "bg-amber-500";
    return "bg-sky-500";
  };
  return (
    <div className="flex items-end gap-1" data-testid="score-meter">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm transition-colors ${barH} ${color(i)} ${
            i < active ? "shadow-[0_0_8px_rgba(16,185,129,0.35)]" : ""
          }`}
        />
      ))}
    </div>
  );
}

export function fmtTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
