import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { ScoreMeter, TempBadge } from "@/components/shared";
import { Phone, PhoneOff, CheckCircle2, Calendar, Bell, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AICallModal({ open, lead, onClose, onComplete }) {
  const [phase, setPhase] = useState("connecting"); // connecting | talking | done
  const [visible, setVisible] = useState([]);
  const [typing, setTyping] = useState(false);
  const [result, setResult] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const scrollRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    if (!open) return;
    setPhase("connecting");
    setVisible([]);
    setResult(null);
    setSeconds(0);
    setTyping(false);
    timers.current = [];

    let mounted = true;
    const secInt = setInterval(() => setSeconds((s) => s + 1), 1000);

    (async () => {
      try {
        const { data } = await api.post(`/leads/${lead.id}/ai-call`);
        if (!mounted) return;
        setResult(data);
        // brief "connecting" then play transcript
        const t0 = setTimeout(() => {
          if (!mounted) return;
          setPhase("talking");
          playTranscript(data.transcript, mounted);
        }, 1400);
        timers.current.push(t0);
      } catch (e) {
        toast.error("Could not connect the AI call. Please try again.");
        onClose?.();
      }
    })();

    return () => {
      mounted = false;
      clearInterval(secInt);
      timers.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const playTranscript = (transcript, mounted) => {
    let delay = 0;
    transcript.forEach((line, idx) => {
      const isAI = line.speaker === "AI";
      // typing indicator
      const tStart = setTimeout(() => {
        if (mounted) setTyping(isAI ? "AI" : "Lead");
      }, delay);
      timers.current.push(tStart);
      delay += isAI ? 1100 : 700;
      const tShow = setTimeout(() => {
        if (!mounted) return;
        setTyping(false);
        setVisible((v) => [...v, line]);
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 40);
        if (idx === transcript.length - 1) {
          const tDone = setTimeout(() => mounted && setPhase("done"), 900);
          timers.current.push(tDone);
        }
      }, delay);
      timers.current.push(tShow);
      delay += 250;
    });
  };

  const mm = String(Math.floor(seconds / 60)).padStart(1, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const finish = () => {
    onComplete?.(result);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent
        className="max-w-lg border-border bg-[#050505] p-0 overflow-hidden"
        data-testid="ai-call-modal"
      >
        <DialogTitle className="sr-only">AI Sales Call with {lead?.name}</DialogTitle>
        {/* header */}
        <div className="flex items-center justify-between border-b border-border bg-black px-6 py-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              AI Sales Call
              <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[9px] text-blue-300">Demo Mode</span>
            </div>
            <div className="mt-1 font-head text-lg font-bold">{lead?.name}</div>
            <div className="font-mono text-xs text-muted-foreground">{lead?.phone || "+91 •••••"}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-ring" />
              {phase === "done" ? "Completed" : "Connected"}
            </div>
            <div className="mt-1 font-mono text-2xl font-bold tabular-nums">
              {mm}:{ss}
            </div>
          </div>
        </div>

        {/* body */}
        {phase === "connecting" && (
          <div className="flex h-72 flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15 pulse-ring">
              <Phone className="h-7 w-7 text-blue-400" />
            </div>
            <div className="text-sm">AI Sales Employee is dialing {lead?.name?.split(" ")[0]}…</div>
          </div>
        )}

        {(phase === "talking" || phase === "done") && (
          <div ref={scrollRef} className="h-80 space-y-4 overflow-y-auto px-6 py-5">
            {visible.map((line, i) => (
              <div key={i} className={`fade-up flex ${line.speaker === "AI" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm ${
                    line.speaker === "AI"
                      ? "bg-blue-500/10 border border-blue-500/20 text-blue-50"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {line.speaker === "AI" ? "Alex · AI" : lead?.name?.split(" ")[0]}
                  </div>
                  {line.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className={`flex ${typing === "AI" ? "justify-start" : "justify-end"}`}>
                <div className="rounded-lg bg-secondary px-3 py-2.5">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* result footer */}
        {phase === "done" && result ? (
          <div className="fade-up border-t border-border bg-black px-6 py-5" data-testid="call-result">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Qualification complete
              </div>
              <div className="flex items-center gap-3">
                <TempBadge temp={result.temperature} />
                <span className="font-head text-xl font-bold text-emerald-400">{result.score}/100</span>
              </div>
            </div>
            <ScoreMeter score={result.score} />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md border border-border bg-secondary/40 p-2">
                <TrendingUp className="mx-auto mb-1 h-4 w-4 text-primary" />
                Status → APPOINTMENT
              </div>
              <div className="rounded-md border border-border bg-secondary/40 p-2">
                <Calendar className="mx-auto mb-1 h-4 w-4 text-primary" />
                {result.appointment.day} {result.appointment.time}
              </div>
              <div className="rounded-md border border-border bg-secondary/40 p-2">
                <Bell className="mx-auto mb-1 h-4 w-4 text-primary" />
                Follow-up created
              </div>
            </div>
            <Button
              onClick={finish}
              data-testid="call-finish-btn"
              className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              View updated lead
            </Button>
          </div>
        ) : (
          <div className="border-t border-border bg-black px-6 py-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full gap-2 text-muted-foreground hover:text-red-400"
              data-testid="call-hangup-btn"
            >
              <PhoneOff className="h-4 w-4" /> End call
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
