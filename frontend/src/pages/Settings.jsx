import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Building2, MapPin, Globe, Briefcase } from "lucide-react";

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-4 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="w-32 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [org, setOrg] = useState(null);

  useEffect(() => { api.get("/organization").then((r) => setOrg(r.data)); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-head text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">Organization &amp; account details.</p>
        </div>
        <span className="rounded bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Demo Data</span>
      </div>

      {org && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-2 font-head text-lg font-semibold">Organization</h3>
          <Row icon={Building2} label="Name" value={org.name} />
          <Row icon={Briefcase} label="Industry" value={org.industry} />
          <Row icon={MapPin} label="Location" value={org.location} />
          <Row icon={Globe} label="Website" value={org.website} />
          <div className="pt-4 text-sm text-muted-foreground">{org.description}</div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-2 font-head text-lg font-semibold">Account</h3>
        <Row icon={Building2} label="Name" value={user?.name} />
        <Row icon={Globe} label="Email" value={user?.email} />
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 text-sm text-blue-100/80">
        <div className="font-semibold text-blue-300">Demo Mode</div>
        <p className="mt-1">
          This is a demonstration environment. Real phone calling, WhatsApp, SMS and email delivery are not
          connected — calls run in Demo Call Mode. No real messages are sent.
        </p>
      </div>
    </div>
  );
}
