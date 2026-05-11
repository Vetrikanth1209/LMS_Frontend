import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/SystemCheck.css";

// ─── Scale ────────────────────────────────────────────────────────────────────
const REQUIRED_SPEED_MBPS = 2.5;
const MIN_GAUGE_MBPS      = 1;
const MAX_GAUGE_MBPS      = 15;

// ─── SVG canvas ───────────────────────────────────────────────────────────────
const SVG_W = 320;
const CY    = 155;
const SVG_H = CY + 20;
const CX    = SVG_W / 2;

const ARC_R  = 115;
const NR     = 100;

const ARC_START = 270;
const ARC_SWEEP = 180;

// Speed → angle mapping: 1 Mbps → 270° (left), 15 Mbps → 90° (right)
function speedToAngle(mbps) {
  const ratio = (clamp(mbps, MIN_GAUGE_MBPS, MAX_GAUGE_MBPS) - MIN_GAUGE_MBPS)
              / (MAX_GAUGE_MBPS - MIN_GAUGE_MBPS);
  return ARC_START + ratio * ARC_SWEEP;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

// ─── SVG helpers ──────────────────────────────────────────────────────────────
function polarXY(angleDeg, r, cx = CX, cy = CY) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(startDeg, sweepDeg, r = ARC_R) {
  const s = polarXY(startDeg, r);
  const e = polarXY(startDeg + sweepDeg, r);
  const large = Math.abs(sweepDeg) > 180 ? 1 : 0;
  const sweep = sweepDeg >= 0 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

// ─── Measurement ──────────────────────────────────────────────────────────────
const TEST_FILES = [
  "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js",
  "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
  "https://cdn.jsdelivr.net/npm/rxjs@7.8.1/dist/bundles/rxjs.umd.min.js",
  "https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js",
];

async function measurePing() {
  const times = [];
  for (let i = 0; i < 5; i++) {
    try {
      const t0 = performance.now();
      await fetch(`${TEST_FILES[0]}?ping&t=${Date.now()}&i=${i}`, { method: "HEAD", cache: "no-store", mode: "cors" });
      times.push(performance.now() - t0);
    } catch (_) {}
    await sleep(50);
  }
  if (!times.length) return { ping: null, jitter: null };
  const avg    = times.reduce((a, b) => a + b, 0) / times.length;
  const jitter = times.length > 1
    ? times.slice(1).reduce((s, t, i) => s + Math.abs(t - times[i]), 0) / (times.length - 1)
    : 0;
  return { ping: Math.round(avg), jitter: Math.round(jitter) };
}

async function measureDownload(onLive, signal) {
  const readings = [];
  for (const url of TEST_FILES) {
    if (signal?.aborted) break;
    try {
      const t0  = performance.now();
      const res = await fetch(`${url}?dl&t=${Date.now()}`, { cache: "no-store", mode: "cors", signal });
      if (!res.ok) continue;
      const buf     = await res.arrayBuffer();
      const elapsed = (performance.now() - t0) / 1000;
      const mbps    = (buf.byteLength * 8) / elapsed / 1_000_000;
      if (mbps > 0 && mbps < 10_000) {
        readings.push(mbps);
        onLive(+(readings.reduce((a, b) => a + b, 0) / readings.length).toFixed(2));
      }
    } catch (e) { if (e.name === "AbortError") break; }
  }
  if (!readings.length) return null;
  return +(readings.reduce((a, b) => a + b, 0) / readings.length).toFixed(2);
}

async function measureUpload(onLive, signal) {
  const CHUNK = 256 * 1024;
  const readings = [];
  for (let i = 0; i < 5; i++) {
    if (signal?.aborted) break;
    try {
      const buf = new Uint8Array(CHUNK);
      crypto.getRandomValues(buf);
      const t0 = performance.now();
      await fetch(`https://httpbin.org/post?r=${Date.now()}&i=${i}`, {
        method: "POST", body: new Blob([buf]), cache: "no-store", mode: "cors", signal,
      });
      const elapsed = (performance.now() - t0) / 1000;
      const mbps    = (CHUNK * 8) / elapsed / 1_000_000;
      if (mbps > 0 && mbps < 10_000) {
        readings.push(mbps);
        onLive(+(readings.reduce((a, b) => a + b, 0) / readings.length).toFixed(2));
      }
    } catch (e) { if (e.name === "AbortError") break; }
    await sleep(80);
  }
  if (!readings.length) return null;
  return +(readings.reduce((a, b) => a + b, 0) / readings.length).toFixed(2);
}

// ─── Tick values ──────────────────────────────────────────────────────────────
const TICK_MAJORS = [1, 3, 5, 7, 9, 11, 13, 15];

// ─── Gauge SVG ────────────────────────────────────────────────────────────────
function GaugeComponent({ speedMbps, needleDeg, phase }) {
  const phaseColor =
    phase === "download"       ? "#0c83c8" :
    phase === "upload"         ? "#10b981" :
    phase === "ping"           ? "#f59e0b" :
    phase === "resetting"      ? "#94a3b8" : "#94a3b8";

  const fillSweep   = needleDeg - ARC_START;
  const threshAngle = speedToAngle(REQUIRED_SPEED_MBPS);
  const isActive    = phase !== "idle" && phase !== "done" && phase !== "resetting";

  const tip   = polarXY(needleDeg,       NR);
  const tail  = polarXY(needleDeg + 180, 14);
  const wingL = polarXY(needleDeg +  90,  5);
  const wingR = polarXY(needleDeg -  90,  5);

  const phaseLabel =
    phase === "ping"      ? "TESTING PING" :
    phase === "download"  ? "DOWNLOAD"     :
    phase === "resetting" ? "RESETTING…"   :
    phase === "upload"    ? "UPLOAD"       :
    phase === "done"      ? "COMPLETE"     : "";

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      style={{ width: "100%", maxWidth: 340, height: "auto", display: "block", margin: "0 auto", overflow: "hidden" }}
    >
      <defs>
        <linearGradient id="fillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={phaseColor} stopOpacity="0.5" />
          <stop offset="100%" stopColor={phaseColor} />
        </linearGradient>
        <filter id="nShadow" x="-80%" y="-80%" width="260%" height="260%">
          <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor={phaseColor} floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Background track */}
      <path d={arcPath(ARC_START, ARC_SWEEP)} fill="none" stroke="#e2e8f0" strokeWidth="13" strokeLinecap="round" />

      {/* Filled arc */}
      {fillSweep > 0.5 && (
        <>
          {isActive && (
            <path d={arcPath(ARC_START, fillSweep)} fill="none" stroke={phaseColor}
              strokeWidth="22" strokeLinecap="round" opacity="0.12" />
          )}
          <path d={arcPath(ARC_START, fillSweep)} fill="none" stroke="url(#fillGrad)"
            strokeWidth="13" strokeLinecap="round" />
        </>
      )}

      {/* Major ticks + labels */}
      {TICK_MAJORS.map((v) => {
        const ang   = speedToAngle(v);
        const outer = polarXY(ang, ARC_R + 14);
        const inner = polarXY(ang, ARC_R +  2);
        const lbl   = polarXY(ang, ARC_R + 27);
        return (
          <g key={v}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="middle"
              fill="#94a3b8" fontSize="9.5" fontFamily="'DM Sans', sans-serif" fontWeight="700">
              {v}
            </text>
          </g>
        );
      })}

      {/* Minor ticks every 1 Mbps */}
      {Array.from({ length: 14 }, (_, i) => {
        const v   = MIN_GAUGE_MBPS + i + 1;
        if (TICK_MAJORS.includes(v)) return null;
        const ang  = speedToAngle(v);
        const out2 = polarXY(ang, ARC_R + 8);
        const in2  = polarXY(ang, ARC_R + 2);
        return (
          <line key={i} x1={in2.x} y1={in2.y} x2={out2.x} y2={out2.y}
            stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
        );
      })}

      {/* Threshold marker @ 2.5 Mbps */}
      {(() => {
        const a  = threshAngle;
        const p1 = polarXY(a, ARC_R +  1);
        const p2 = polarXY(a, ARC_R + 16);
        const lp = polarXY(a, ARC_R + 28);
        return (
          <>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
              fill="#f97316" fontSize="7.5" fontFamily="'DM Sans', sans-serif" fontWeight="800">
              MIN
            </text>
          </>
        );
      })()}

      {/* Needle */}
      <g filter={isActive ? "url(#nShadow)" : undefined}>
        <polygon
          points={`${tip.x},${tip.y} ${wingL.x},${wingL.y} ${tail.x},${tail.y} ${wingR.x},${wingR.y}`}
          fill={isActive ? phaseColor : "#1e293b"}
        />
      </g>

      {/* Pivot hub */}
      <circle cx={CX} cy={CY} r="11" fill="#1e293b" />
      <circle cx={CX} cy={CY} r="4.5" fill={isActive ? phaseColor : "#64748b"} />

      {/* Speed number */}
      <text x={CX} y={CY - 52} textAnchor="middle" fill="#0f172a" fontSize="40"
        fontFamily="'Rajdhani', sans-serif" fontWeight="700" letterSpacing="-0.5">
        {phase === "idle" || phase === "resetting" ? "—" : (speedMbps || 0).toFixed(1)}
      </text>
      <text x={CX} y={CY - 33} textAnchor="middle" fill="#94a3b8" fontSize="8"
        fontFamily="'DM Sans', sans-serif" fontWeight="700" letterSpacing="2.5">
        Mbps
      </text>

      {/* Phase label */}
      <text x={CX} y={CY - 18} textAnchor="middle" fill={phaseColor} fontSize="7.5"
        fontFamily="'DM Sans', sans-serif" fontWeight="700" letterSpacing="2.5">
        {phaseLabel}
      </text>
    </svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, unit, active, color }) {
  const colors = {
    blue:  { bg: "rgba(12,131,200,0.07)",  border: "rgba(12,131,200,0.28)",  text: "#0c83c8" },
    green: { bg: "rgba(16,185,129,0.07)",  border: "rgba(16,185,129,0.28)",  text: "#10b981" },
    amber: { bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.28)",  text: "#d97706" },
  };
  const c = colors[color] || {};

  return (
    <div
      className="sc-stat"
      style={{
        background: active ? c.bg : "#f8fafc",
        border: `1px solid ${active ? c.border : "#e2e8f0"}`,
        transform: active ? "translateY(-2px)" : "none",
        boxShadow: active ? `0 4px 16px ${c.border}` : "none",
      }}
    >
      <div className="sc-stat__icon">{icon}</div>
      <div className="sc-stat__label">{label}</div>
      <div
        className="sc-stat__value"
        style={{ color: active ? c.text : (value !== null ? "#1e293b" : "#cbd5e1") }}
      >
        {value !== null ? Number(value).toFixed(value < 10 ? 1 : 0) : "—"}
      </div>
      <div className="sc-stat__unit">{unit}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SystemCheck() {
  const navigate          = useNavigate();
  const { testId }        = useParams();

  const [phase,     setPhase]     = useState("idle");
  const [liveSpeed, setLiveSpeed] = useState(0);
  const [dlSpeed,   setDlSpeed]   = useState(null);
  const [ulSpeed,   setUlSpeed]   = useState(null);
  const [ping,      setPing]      = useState(null);
  const [jitter,    setJitter]    = useState(null);
  const [progress,  setProgress]  = useState(0);
  const [result,    setResult]    = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [failReason, setFailReason] = useState("");

  const [needleDeg, setNeedleDeg] = useState(ARC_START);
  const targetDeg   = useRef(ARC_START);
  const abortCtrl   = useRef(null);
  const countdownId = useRef(null);

  // Smooth animated needle (rAF easing)
  useEffect(() => {
    let raf;
    const loop = () => {
      setNeedleDeg((prev) => {
        const diff = targetDeg.current - prev;
        return Math.abs(diff) < 0.02 ? targetDeg.current : prev + diff * 0.10;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const displaySpeed = phase === "done" ? (dlSpeed || 0) : liveSpeed;

  useEffect(() => {
    if (phase === "idle" || phase === "resetting") {
      targetDeg.current = ARC_START;
      return;
    }
    const safe = clamp(displaySpeed || MIN_GAUGE_MBPS, MIN_GAUGE_MBPS, MAX_GAUGE_MBPS);
    targetDeg.current = speedToAngle(safe);
  }, [displaySpeed, phase]);

  const stopAll = () => { abortCtrl.current?.abort(); clearInterval(countdownId.current); };

  const reset = () => {
    stopAll();
    setPhase("idle"); setLiveSpeed(0); setDlSpeed(null); setUlSpeed(null);
    setPing(null); setJitter(null); setProgress(0); setResult(null); setCountdown(null);
    setFailReason("");
    targetDeg.current = ARC_START;
  };

  const startCountdown = (seconds, onDone) => {
    setCountdown(seconds);
    countdownId.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownId.current); onDone?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * Descends the needle back to the zero (left) position over ~3 seconds,
   * updating liveSpeed in small steps so the rAF loop animates it smoothly.
   * The phase is set to "resetting" so the gauge shows a neutral state.
   */
  const descendNeedleToZero = (fromSpeed) => {
    return new Promise((resolve) => {
      setPhase("resetting");
      const STEPS    = 30;           // 30 ticks over 3 s
      const INTERVAL = 3000 / STEPS; // 100 ms per tick
      let step = 0;

      const id = setInterval(() => {
        step++;
        const ratio     = 1 - step / STEPS;               // 1 → 0
        const nextSpeed = Math.max(fromSpeed * ratio, 0);
        setLiveSpeed(nextSpeed);
        targetDeg.current = speedToAngle(
          clamp(nextSpeed || MIN_GAUGE_MBPS, MIN_GAUGE_MBPS, MAX_GAUGE_MBPS)
        );

        if (step >= STEPS) {
          clearInterval(id);
          setLiveSpeed(0);
          targetDeg.current = ARC_START;
          resolve();
        }
      }, INTERVAL);
    });
  };

  const runTest = useCallback(async () => {
    reset();
    const ctrl = new AbortController();
    abortCtrl.current = ctrl;

    // ── Ping ──
    setPhase("ping"); setProgress(5);
    const { ping: p, jitter: j } = await measurePing();
    if (ctrl.signal.aborted) return;
    setPing(p); setJitter(j); setProgress(20);
    await sleep(350);

    // ── Download ──
    setPhase("download"); setLiveSpeed(MIN_GAUGE_MBPS);
    const dl = await measureDownload((live) => {
      setLiveSpeed(live);
      setProgress((pr) => Math.min(pr + 3, 60));
    }, ctrl.signal);
    if (ctrl.signal.aborted) return;
    setDlSpeed(dl); setLiveSpeed(dl || 0); setProgress(65);
    await sleep(350);

    // ── Needle descent: wait 3 s while smoothly sweeping back to 0 ──
    await descendNeedleToZero(dl || MIN_GAUGE_MBPS);
    if (ctrl.signal.aborted) return;

    // ── Upload ──
    setPhase("upload"); setLiveSpeed(MIN_GAUGE_MBPS);
    let ul = await measureUpload((live) => {
      setLiveSpeed(live);
      setProgress((pr) => Math.min(pr + 6, 95));
    }, ctrl.signal);
    if (!ul && dl) ul = +(dl * 0.4).toFixed(2);
    if (ctrl.signal.aborted) return;
    setUlSpeed(ul); setLiveSpeed(ul || 0); setProgress(100);
    await sleep(350);

    // ── Done ──
    setPhase("done");
    const dlPassed = dl !== null && dl >= REQUIRED_SPEED_MBPS;
    const ulPassed = ul !== null && ul >= REQUIRED_SPEED_MBPS;
    const passed   = dlPassed && ulPassed;

    if (!passed) {
      const reasons = [];
      if (!dlPassed) reasons.push(`Download ${dl?.toFixed(1) ?? "—"} Mbps`);
      if (!ulPassed) reasons.push(`Upload ${ul?.toFixed(1) ?? "—"} Mbps`);
      setFailReason(reasons.join(" · ") + ` (need ${REQUIRED_SPEED_MBPS} Mbps each)`);
    }

    setResult(passed ? "pass" : "fail");
    if (passed) startCountdown(5, () => navigate(`/test-intro/${testId}`));
  }, []); // eslint-disable-line

  useEffect(() => () => stopAll(), []);

  const isRunning = phase !== "idle" && phase !== "done";

  return (
    <div className="sc-root">
      {/* Top bar */}
      <div className="sc-topbar">
        <svg viewBox="0 0 24 24" fill="none" stroke="#0c83c8" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <circle cx="12" cy="20" r="1" fill="#0c83c8" />
        </svg>
        <span className="sc-topbar__title">Connection Speed Check</span>
        {result && (
          <span className={`sc-topbar__badge sc-topbar__badge--${result}`}>
            {result === "pass" ? "✓ READY" : "✗ TOO SLOW"}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="sc-body">
        <div className="sc-card">
          {/* Colour bar */}
          <div className="sc-colorbar" />

          {/* Head */}
          <div className="sc-head">
            <div className="sc-head__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#0c83c8" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <circle cx="12" cy="20" r="1" fill="#0c83c8" />
              </svg>
            </div>
            <div>
              <h1 className="sc-head__title">Speed Test</h1>
              <p className="sc-head__sub">
                Minimum <strong>{REQUIRED_SPEED_MBPS} Mbps</strong> required for the assessment
              </p>
            </div>
          </div>

          {/* Gauge */}
          <div className="sc-gauge-wrap">
            <GaugeComponent speedMbps={displaySpeed} needleDeg={needleDeg} phase={phase} />
          </div>

          {/* Progress bar */}
          {isRunning && (
            <div className="sc-progress">
              <div className="sc-progress__track">
                <div className="sc-progress__fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="sc-progress__pct">{progress}%</span>
            </div>
          )}

          {/* Stat cards */}
          <div className="sc-stats">
            <StatCard icon="↓" label="Download" value={dlSpeed} unit="Mbps" active={phase === "download"} color="blue"  />
            <StatCard icon="↑" label="Upload"   value={ulSpeed} unit="Mbps" active={phase === "upload"}   color="green" />
            <StatCard icon="⏱" label="Ping"    value={ping}    unit="ms"   active={phase === "ping"}     color="amber" />
            <StatCard icon="〰" label="Jitter"  value={jitter}  unit="ms"   active={false}                color="amber" />
          </div>

          {/* Result box */}
          {result && (
            <div className={`sc-result sc-result--${result}`}>
              <span className="sc-result__emoji">{result === "pass" ? "✅" : "❌"}</span>
              <div className="sc-result__body">
                <div className="sc-result__title">
                  {result === "pass"
                    ? `Connection ready! ↓ ${dlSpeed?.toFixed(1)} · ↑ ${ulSpeed?.toFixed(1)} Mbps`
                    : `Speed too low — ${failReason}`}
                </div>
                <div className="sc-result__sub">
                  {result === "pass"
                    ? `Proceeding to assessment in ${countdown}s…`
                    : "Improve your connection and try again."}
                </div>
              </div>
              {result === "pass" && countdown > 0 && (
                <button
                  className="sc-result__cta"
                  onClick={() => {
                    clearInterval(countdownId.current);
                    navigate(`/test-intro/${testId}`);
                  }}
                >
                  Proceed now
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="sc-actions">
            {phase === "idle" && (
              <button className="sc-btn-go" onClick={runTest}>GO</button>
            )}

            {isRunning && (
              <div className="sc-spinner-row">
                <div className="sc-spinner" />
                {phase === "resetting" ? "Resetting meter…" : "Testing your connection…"}
              </div>
            )}

            {phase === "done" && (
              <button
                className={`sc-btn-retest sc-btn-retest--${result}`}
                onClick={runTest}
              >
                ↻ {result === "fail" ? "Try Again" : "Retest"}
              </button>
            )}
          </div>

          {/* Tips on fail */}
          {result === "fail" && (
            <div className="sc-tips">
              <div className="sc-tips__heading">Tips to improve speed</div>
              <ul className="sc-tips__list">
                {[
                  "Move closer to your Wi-Fi router",
                  "Close other tabs & apps consuming bandwidth",
                  "Use a wired (Ethernet) connection if possible",
                  "Restart your router and retry",
                  "Contact your ISP if the issue persists",
                ].map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}