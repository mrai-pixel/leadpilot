// Shared small UI helpers for LeadPilot (light editorial theme)
import { Flame, Snowflake, Thermometer } from "lucide-react";

export const STATUS_STYLES = {
  NEW: "bg-zinc-100 text-zinc-700 border-zinc-200",
  CONTACTED: "bg-sky-50 text-sky-700 border-sky-200",
  ENGAGED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  QUALIFIED: "bg-amber-50 text-amber-700 border-amber-200",
  APPOINTMENT: "bg-orange-50 text-orange-700 border-orange-300",
  WON: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOST: "bg-red-50 text-red-700 border-red-200",
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
    HOT: { cls: "text-red-600", Icon: Flame, label: "HOT" },
    WARM: { cls: "text-amber-600", Icon: Thermometer, label: "WARM" },
    COLD: { cls: "text-sky-600", Icon: Snowflake, label: "COLD" },
  };
  const { cls, Icon, label } = map[temp] || map.COLD;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

export function scoreColor(score) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 55) return "text-amber-600";
  return "text-sky-600";
}

export function ScoreMeter({ score, size = "md" }) {
  const segments = 10;
  const active = Math.round((score / 100) * segments);
  const barH = size === "lg" ? "h-8" : "h-4";
  const color = (i) => {
    if (i >= active) return "bg-zinc-200";
    const ratio = score / 100;
    if (ratio >= 0.8) return "bg-emerald-500";
    if (ratio >= 0.55) return "bg-amber-500";
    return "bg-sky-500";
  };
  return (
    <div className="flex items-end gap-1" data-testid="score-meter">
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} className={`flex-1 rounded-sm transition-colors ${barH} ${color(i)}`} />
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
