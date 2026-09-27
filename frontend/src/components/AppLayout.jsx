import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, KanbanSquare, Bot, Calendar, Phone, Settings,
  LogOut, Menu, X, Radar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/leads", label: "Leads", icon: Users },
  { to: "/app/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/app/agent", label: "AI Sales Agent", icon: Bot },
  { to: "/app/appointments", label: "Appointments", icon: Calendar },
  { to: "/app/calls", label: "Calls", icon: Phone },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-orange-50 text-orange-700 border-l-2 border-orange-600"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
            }`
          }
        >
          <item.icon className="h-[18px] w-[18px]" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-6 py-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-600 text-white">
        <Radar className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-xl tracking-tight">LEADPILOT</div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">
          Your AI Sales Employee
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <Brand />
      <NavItems onNavigate={() => setOpen(false)} />
      <div className="mt-auto p-3">
        <div className="mb-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <div className="text-xs font-semibold text-zinc-900">{user?.name}</div>
          <div className="text-[11px] text-zinc-500 truncate">{user?.email}</div>
          <span className="mt-2 inline-block rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-700">
            Demo Data
          </span>
        </div>
        <Button
          variant="ghost"
          data-testid="logout-btn"
          onClick={doLogout}
          className="w-full justify-start gap-3 text-zinc-500 hover:text-zinc-900"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white fixed inset-y-0">
        {SidebarInner}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-zinc-200 bg-white">
            {SidebarInner}
          </div>
        </div>
      )}

      <div className="flex-1 md:ml-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-md md:hidden">
          <Button variant="ghost" size="icon" data-testid="mobile-menu-btn" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="font-display text-lg tracking-tight">LEADPILOT</span>
        </header>
        <main className="p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
