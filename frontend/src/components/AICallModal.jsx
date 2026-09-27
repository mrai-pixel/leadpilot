import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { ScoreMeter, TempBadge } from "@/components/shared";
import { Phone, PhoneOff, CheckCircle2, Calendar, Bell, TrendingUp } from "lucide-react";
import { toast } from "sonner";

function Waveform({ active }) {
  const bars = 34;
  return (
    <div className="flex h-9 items-center justify-center gap-[3px]" data-testid="call-waveform">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="wave-bar w-[3px] rounded-full bg-orange-500"
          style={{
            height: "100%",
            animationDelay: `${(i % 9) * 0.07}s`,
            animationDuration: active ? "0.7s" : "1.5s",
            opacity: active ? 1 : 0.45,
          }}
        />
      ))}
    </div>
  );
}

export default function AICallModal({ open, lead, onClose, onComplete }) {
  const [phase, setPhase] = useState("connecting"); // connecting | talking | done
  const [visible, setVisible] = useState([]);
  const [typing, setTyping] = useState(false);
  const [result, setResult] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const scrollRef = useRef(null);
  const timers = useRef([]);
  const runRef = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      runRef.current = null;
      return;
    }
    setPhase("connecting");
    setVisible([]);
    setResult(null);
    setSeconds(0);
    setTyping(false);
    completedRef.current = false;
    timers.current = [];

    let cancelled = false;
    const isActive = () => !cancelled;
    const secInt = setInterval(() => setSeconds((s) => s + 1), 1000);

    if (!runRef.current || runRef.current.leadId !== lead.id) {
      runRef.current = {
        leadId: lead.id,
        promise: api.post(`/leads/${lead.id}/ai-call`).then((r) => r.data),
      };
    }

    runRef.current.promise
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        const t0 = setTimeout(() => {
          if (cancelled) return;
          setPhase("talking");
          playTranscript(data.transcript, isActive, data);
        }, 1400);
        timers.current.push(t0);
      })
      .catch(() => {
        runRef.current = null;
        toast.error("Could not connect the AI call. Please try again.");
        onClose?.();
      });

    return () => {
      cancelled = true;
      clearInterval(secInt);
      timers.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const playTranscript = (transcript, isActive, data) => {
    let delay = 0;
    transcript.forEach((line, idx) => {
      const isAI = line.speaker === "AI";
      const tStart = setTimeout(() => {
        if (isActive()) setTyping(isAI ? "AI" : "Lead");
      }, delay);
      timers.current.push(tStart);
      delay += isAI ? 1100 : 700;
      const tShow = setTimeout(() => {
        if (!isActive()) return;
        setTyping(false);
        setVisible((v) => [...v, line]);
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 40);
        if (idx === transcript.length - 1) {
          const tDone = setTimeout(() => {
            if (!isActive()) return;
            setPhase("done");
            fireComplete(data);
          }, 900);
          timers.current.push(tDone);
        }
      }, delay);
      timers.current.push(tShow);
      delay += 250;
    });
  };

  const fireComplete = (data) => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.(data || result);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(1, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const close = () => {
    if (result) fireComplete(result);
    onClose?.();
  };

  const finish = () => close();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        className="max-w-lg border-zinc-200 bg-white p-0 overflow-hidden"
        data-testid="ai-call-modal"
      >
        <DialogTitle className="sr-only">AI Sales Call with {lead?.name}</DialogTitle>
        <DialogDescription className="sr-only">
          Simulated demo AI sales call. The AI qualifies the lead and books a site visit.
        </DialogDescription>

        {/* header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6 py-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              AI Sales Call
              <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[9px] text-orange-700">Demo Mode</span>
            </div>
            <div className="mt-1 font-display text-xl tracking-tight">{lead?.name}</div>
            <div className="font-mono text-xs text-zinc-500">{lead?.phone || "+91 •••••"}</div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-orange-600">
              <span className="h-2 w-2 rounded-full bg-orange-500 pulse-ring" />
              {phase === "done" ? "Completed" : "Connected"}
            </div>
            <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-zinc-900">
              {mm}:{ss}
            </div>
          </div>
        </div>

        {/* live waveform */}
        {phase !== "done" && (
          <div className="border-b border-zinc-100 bg-white px-6 py-3">
            <Waveform active={phase === "connecting" || typing === "AI"} />
          </div>
        )}

        {/* body */}
        {phase === "connecting" && (
          <div className="flex h-72 flex-col items-center justify-center gap-4 text-zinc-500">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 pulse-ring">
              <Phone className="h-7 w-7 text-orange-600" />
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
                      ? "bg-orange-50 border border-orange-200 text-orange-950"
                      : "bg-zinc-100 text-zinc-900"
                  }`}
                >
                  <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {line.speaker === "AI" ? "Alex · AI" : lead?.name?.split(" ")[0]}
                  </div>
                  {line.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className={`flex ${typing === "AI" ? "justify-start" : "justify-end"}`}>
                <div className="rounded-lg bg-zinc-100 px-3 py-2.5">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* result footer */}
        {phase === "done" && result ? (
          <div className="fade-up border-t border-zinc-200 bg-zinc-50 px-6 py-5" data-testid="call-result">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Qualification complete
              </div>
              <div className="flex items-center gap-3">
                <TempBadge temp={result.temperature} />
                <span className="font-display text-2xl text-emerald-600">{result.score}/100</span>
              </div>
            </div>
            <ScoreMeter score={result.score} />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md border border-zinc-200 bg-white p-2 text-zinc-700">
                <TrendingUp className="mx-auto mb-1 h-4 w-4 text-orange-600" />
                Status → APPOINTMENT
              </div>
              <div className="rounded-md border border-zinc-200 bg-white p-2 text-zinc-700">
                <Calendar className="mx-auto mb-1 h-4 w-4 text-orange-600" />
                {result.appointment.day} {result.appointment.time}
              </div>
              <div className="rounded-md border border-zinc-200 bg-white p-2 text-zinc-700">
                <Bell className="mx-auto mb-1 h-4 w-4 text-orange-600" />
                Follow-up created
              </div>
            </div>
            <Button
              onClick={finish}
              data-testid="call-finish-btn"
              className="mt-4 w-full bg-orange-600 text-white hover:bg-orange-700"
            >
              View updated lead
            </Button>
          </div>
        ) : (
          <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-3">
            <Button
              variant="ghost"
              onClick={close}
              className="w-full gap-2 text-zinc-500 hover:text-red-600"
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
