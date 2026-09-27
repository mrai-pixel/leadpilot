import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radar, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/app");
    } catch (err) {
      toast.error(apiError(err.response?.data?.detail) || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const demo = async () => {
    setLoading(true);
    try {
      await demoLogin();
      toast.success("Welcome to the UrbanNest Realty demo");
      navigate("/app");
    } catch {
      toast.error("Could not start demo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-white md:grid-cols-2">
      <div className="relative hidden flex-col justify-between border-r border-zinc-200 bg-zinc-50 p-12 md:flex grid-bg">
        <Link to="/" className="flex items-center gap-2.5" data-testid="brand-home-link">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-600 text-white">
            <Radar className="h-5 w-5" />
          </div>
          <span className="font-display text-xl tracking-tight">LEADPILOT</span>
        </Link>
        <div>
          <div className="mb-4 inline-block border border-orange-200 bg-orange-50 px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-widest text-orange-700">
            The AI Sales Employee
          </div>
          <h1 className="font-display text-5xl uppercase leading-[0.95] tracking-tight text-zinc-950">
            Every lead.<br />Called, qualified<br />&amp; booked.<br />
            <span className="text-orange-600">Automatically.</span>
          </h1>
          <p className="mt-6 max-w-md text-zinc-600">
            Call. Qualify. Follow up. Book. Your AI Sales Employee works every lead so your team never
            drops a hot prospect again.
          </p>
        </div>
        <div className="font-mono text-xs uppercase tracking-widest text-zinc-400">© 2026 LeadPilot AI · Demo environment</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 md:hidden">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h2 className="font-display text-3xl uppercase tracking-tight text-zinc-950">Sign in</h2>
          <p className="mt-1 text-sm text-zinc-500">Access your AI Sales Employee dashboard.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" data-testid="login-email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@urbannest.ai" className="mt-1.5" required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" type="password" data-testid="login-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="mt-1.5" required
              />
            </div>
            <Button
              type="submit" disabled={loading} data-testid="login-submit"
              className="w-full bg-orange-600 text-white hover:bg-orange-700"
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-zinc-400">
            <div className="h-px flex-1 bg-zinc-200" /> OR <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <Button
            variant="outline" onClick={demo} disabled={loading} data-testid="demo-login-btn"
            className="w-full gap-2 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
          >
            <Sparkles className="h-4 w-4" /> Try Demo Account
          </Button>
          <p className="mt-3 text-center text-xs text-zinc-500">
            One click — no setup. Explore UrbanNest Realty&apos;s live demo data.
          </p>
        </div>
      </div>
    </div>
  );
}
