"use client";

import { useEffect, useRef } from "react";

type GameState = {
  pos: number;
  dir: 1 | -1;
  speed: number;
  pins: number;
  total: number;
  target: number;
  zone: number;
  unlocked: boolean;
  flashGood: number;
  flashBad: number;
  holdMsg: number;
  last: number;
};

function initialState(): GameState {
  return {
    pos: 0,
    dir: 1,
    speed: 0.55,
    pins: 0,
    total: 5,
    target: 0.14 + Math.random() * 0.72,
    zone: 0.17,
    unlocked: false,
    flashGood: 0,
    flashBad: 0,
    holdMsg: 0,
    last: 0,
  };
}

export default function LockpickDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initialState());
  const hoverRef = useRef(false);
  const attemptRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newTarget = () => {
      stateRef.current.target = 0.14 + Math.random() * 0.72;
    };

    const reset = () => {
      stateRef.current = initialState();
    };

    const attempt = () => {
      const g = stateRef.current;
      if (g.unlocked) {
        reset();
        return;
      }
      if (Math.abs(g.pos - g.target) <= g.zone / 2) {
        g.pins++;
        g.speed = Math.min(1.4, g.speed + 0.12);
        g.flashGood = 12;
        if (g.pins >= g.total) {
          g.unlocked = true;
          g.holdMsg = 130;
        } else {
          newTarget();
        }
      } else {
        g.flashBad = 16;
        g.pins = Math.max(0, g.pins - 1);
      }
    };

    attemptRef.current = attempt;

    const draw = (g: GameState) => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const padX = 44;
      const trackY = H * 0.6;
      const trackH = 58;
      const trackW = W - padX * 2;

      const pinY = H * 0.24;
      const pinGap = 16;
      const pinW = (trackW - (g.total - 1) * pinGap) / g.total;

      for (let i = 0; i < g.total; i++) {
        const x = padX + i * (pinW + pinGap);
        const on = i < g.pins;
        ctx.fillStyle = on ? "#46f0a0" : "rgba(255,255,255,0.10)";
        ctx.shadowColor = on ? "#46f0a0" : "transparent";
        ctx.shadowBlur = on ? 20 : 0;
        ctx.beginPath();
        ctx.roundRect(x, pinY, pinW, 22, 5);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.roundRect(padX, trackY, trackW, trackH, 12);
      ctx.fill();

      const zx = padX + (g.target - g.zone / 2) * trackW;
      const zw = g.zone * trackW;
      ctx.fillStyle =
        g.flashBad > 0 ? "rgba(255,94,122,0.30)" : "rgba(70,240,160,0.22)";
      ctx.beginPath();
      ctx.roundRect(zx, trackY, zw, trackH, 12);
      ctx.fill();

      ctx.strokeStyle = g.flashBad > 0 ? "#ff5e7a" : "#46f0a0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(zx, trackY, zw, trackH, 12);
      ctx.stroke();

      const mx = padX + g.pos * trackW;
      const mc = g.unlocked
        ? "#46f0a0"
        : g.flashGood > 0
          ? "#22e0ff"
          : "#ff2d9c";
      ctx.fillStyle = mc;
      ctx.shadowColor = mc;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.roundRect(mx - 5, trackY - 12, 10, trackH + 24, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = '600 26px "IBM Plex Mono", monospace';
      ctx.textAlign = "left";
      ctx.fillStyle = g.unlocked ? "#46f0a0" : "rgba(255,255,255,0.55)";
      ctx.fillText(
        g.unlocked
          ? "UNLOCKED — nice one."
          : `PINS SET  ${g.pins} / ${g.total}`,
        padX,
        H * 0.13,
      );
    };

    let raf = 0;
    const loop = (ts: number) => {
      const g = stateRef.current;
      if (!g.last) g.last = ts;
      let dt = (ts - g.last) / 1000;
      g.last = ts;
      if (dt > 0.05) dt = 0.05;

      if (!g.unlocked) {
        g.pos += g.dir * g.speed * dt;
        if (g.pos > 1) {
          g.pos = 1;
          g.dir = -1;
        }
        if (g.pos < 0) {
          g.pos = 0;
          g.dir = 1;
        }
      } else if (g.holdMsg > 0) {
        g.holdMsg--;
        if (g.holdMsg === 0) reset();
      }

      if (g.flashGood > 0) g.flashGood--;
      if (g.flashBad > 0) g.flashBad--;

      draw(g);
      raf = requestAnimationFrame(loop);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && hoverRef.current) {
        e.preventDefault();
        attempt();
      }
    };
    window.addEventListener("keydown", onKey);

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const onPick = () => attemptRef.current();

  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(180deg,#0c0716,#0a0510)",
        border: "1px solid rgba(255,45,156,.35)",
        boxShadow: "0 0 60px rgba(255,45,156,.16)",
      }}
      className="gl-anim-float"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          opacity: 0.4,
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,.45) 3px, rgba(0,0,0,0) 4px)",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 12,
          letterSpacing: ".1em",
          color: "#9a9aa6",
        }}
      >
        <span style={{ color: "#ff2d9c" }}>
          <span className="gl-anim-pulse">●</span> LIVE DEMO
        </span>
        <span>lockpicking.loop</span>
      </div>
      <canvas
        ref={canvasRef}
        width={1000}
        height={340}
        onClick={onPick}
        onMouseEnter={() => {
          hoverRef.current = true;
        }}
        onMouseLeave={() => {
          hoverRef.current = false;
        }}
        style={{
          width: "100%",
          height: 170,
          display: "block",
          cursor: "pointer",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 18px",
          borderTop: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 12,
            color: "#8a8a95",
          }}
        >
          Click /{" "}
          <kbd
            style={{
              border: "1px solid rgba(255,255,255,.25)",
              padding: "1px 6px",
            }}
          >
            Space
          </kbd>{" "}
          in the green zone
        </span>
        <button
          onClick={onPick}
          className="gl-btn-magenta"
          style={{
            border: 0,
            background: "#ff2d9c",
            color: "#0a0410",
            padding: "10px 20px",
            fontFamily: "var(--font-chakra-petch)",
            fontWeight: 700,
            letterSpacing: ".1em",
            cursor: "pointer",
            boxShadow: "0 0 18px rgba(255,45,156,.5)",
          }}
        >
          ▶ SET PIN
        </button>
      </div>
    </div>
  );
}
