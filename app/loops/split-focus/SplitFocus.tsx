"use client";

import { useEffect, useRef, useState } from "react";

const CANVAS_W = 900;
const CANVAS_H = 620;
const RING_CX = CANVAS_W / 2;
const RING_CY = CANVAS_H / 2 + 20;
const RING_R = 230;
const LINE_Y = RING_CY + 40;
const LINE_WINDOW = 24;

const COLORS = {
  M: "#ff2d9c",
  C: "#22e0ff",
  G: "#46f0a0",
  A: "#ffcf5c",
} as const;

type ColorKey = keyof typeof COLORS;
type ShapeKey = "I" | "S" | "T" | "L";

type Block = {
  id: number;
  x: number;
  y: number;
  vy: number;
  shape: ShapeKey;
  color: ColorKey;
  consumed: boolean;
  scored: boolean;
};

type Rule = {
  label: string;
  mode: "press" | "skip";
  matches: (b: Block) => boolean;
};

type MathQ = {
  q: string;
  a: number;
  input: string;
  timeLeft: number;
  maxTime: number;
  state: "input" | "correct" | "wrong";
  hold: number;
};

type Effect = {
  x: number;
  y: number;
  color: string;
  text: string;
  age: number;
  ttl: number;
  vy: number;
  ringR: number;
};

type GameState = {
  status: "idle" | "running" | "over";
  score: number;
  best: number;
  stability: number;
  elapsed: number;

  cx: number;
  cy: number;
  vx: number;
  vy: number;
  mouseX: number;
  mouseY: number;
  driftX: number;
  driftY: number;
  driftIn: number;
  outOfRing: boolean;

  blocks: Block[];
  spawnIn: number;
  blockSeq: number;
  blockLevel: number;

  rule: Rule;
  ruleIn: number;
  ruleLevel: number;

  math: MathQ;
  mathLevel: number;

  effects: Effect[];

  goodFlash: number;
  badFlash: number;

  lastTs: number;
};

const SHAPES: ShapeKey[] = ["I", "S", "T", "L"];
const COLOR_KEYS: ColorKey[] = ["M", "C", "G", "A"];
const COLOR_LABEL: Record<ColorKey, string> = {
  M: "MAGENTA",
  C: "CYAN",
  G: "GREEN",
  A: "AMBER",
};
const SHAPE_LABEL: Record<ShapeKey, string> = {
  I: "LONG",
  S: "S-BLOCK",
  T: "T-BLOCK",
  L: "L-BLOCK",
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function makeRule(level: number): Rule {
  if (level < 2) {
    if (Math.random() < 0.5) {
      const s = pick(SHAPES);
      return {
        label: `PRESS on ${SHAPE_LABEL[s]} blocks`,
        mode: "press",
        matches: (b) => b.shape === s,
      };
    }
    const c = pick(COLOR_KEYS);
    return {
      label: `PRESS on ${COLOR_LABEL[c]} blocks`,
      mode: "press",
      matches: (b) => b.color === c,
    };
  }
  if (level < 4) {
    if (Math.random() < 0.5) {
      const s = pick(SHAPES);
      return {
        label: `DO NOT PRESS on ${SHAPE_LABEL[s]} blocks (press others)`,
        mode: "skip",
        matches: (b) => b.shape === s,
      };
    }
    const c = pick(COLOR_KEYS);
    return {
      label: `DO NOT PRESS on ${COLOR_LABEL[c]} blocks (press others)`,
      mode: "skip",
      matches: (b) => b.color === c,
    };
  }
  const s = pick(SHAPES);
  const c = pick(COLOR_KEYS);
  const mode = Math.random() < 0.5 ? "press" : "skip";
  const label =
    mode === "press"
      ? `PRESS on ${COLOR_LABEL[c]} ${SHAPE_LABEL[s]} blocks`
      : `DO NOT PRESS on ${COLOR_LABEL[c]} ${SHAPE_LABEL[s]} blocks`;
  return {
    label,
    mode,
    matches: (b) => b.shape === s && b.color === c,
  };
}

function makeMath(level: number): MathQ {
  const maxTime = Math.max(3.5, 8 - level * 0.4);
  let a: number, b: number, op: string, ans: number;
  if (level < 1) {
    a = 1 + Math.floor(Math.random() * 9);
    b = 1 + Math.floor(Math.random() * 9);
    op = "+";
    ans = a + b;
  } else if (level < 2) {
    a = 10 + Math.floor(Math.random() * 40);
    b = 1 + Math.floor(Math.random() * 9);
    op = "+";
    ans = a + b;
  } else if (level < 3) {
    if (Math.random() < 0.5) {
      a = 20 + Math.floor(Math.random() * 60);
      b = 1 + Math.floor(Math.random() * (a - 1));
      op = "-";
      ans = a - b;
    } else {
      a = 10 + Math.floor(Math.random() * 40);
      b = 5 + Math.floor(Math.random() * 20);
      op = "+";
      ans = a + b;
    }
  } else if (level < 4) {
    a = 2 + Math.floor(Math.random() * 8);
    b = 2 + Math.floor(Math.random() * 8);
    op = "×";
    ans = a * b;
  } else {
    const roll = Math.random();
    if (roll < 0.33) {
      a = 3 + Math.floor(Math.random() * 9);
      b = 3 + Math.floor(Math.random() * 9);
      op = "×";
      ans = a * b;
    } else if (roll < 0.66) {
      a = 40 + Math.floor(Math.random() * 60);
      b = 5 + Math.floor(Math.random() * 40);
      op = "-";
      ans = a - b;
    } else {
      a = 20 + Math.floor(Math.random() * 60);
      b = 20 + Math.floor(Math.random() * 60);
      op = "+";
      ans = a + b;
    }
  }
  return {
    q: `${a} ${op} ${b}`,
    a: ans,
    input: "",
    timeLeft: maxTime,
    maxTime,
    state: "input",
    hold: 0,
  };
}

function addEffect(
  effects: Effect[],
  opts: { x: number; y: number; color: string; text: string; ttl?: number },
) {
  effects.push({
    x: opts.x,
    y: opts.y,
    color: opts.color,
    text: opts.text,
    age: 0,
    ttl: opts.ttl ?? 0.9,
    vy: -60,
    ringR: 0,
  });
}

function makeBlock(id: number, level: number): Block {
  const speed = 90 + level * 14;
  const marginX = 60;
  const x = RING_CX - RING_R + marginX + Math.random() * (2 * (RING_R - marginX));
  return {
    id,
    x,
    y: RING_CY - RING_R - 20,
    vy: speed + Math.random() * 20,
    shape: pick(SHAPES),
    color: pick(COLOR_KEYS),
    consumed: false,
    scored: false,
  };
}

function freshState(best: number): GameState {
  return {
    status: "idle",
    score: 0,
    best,
    stability: 100,
    elapsed: 0,

    cx: RING_CX,
    cy: RING_CY,
    vx: 0,
    vy: 0,
    mouseX: RING_CX,
    mouseY: RING_CY,
    driftX: 0,
    driftY: 0,
    driftIn: 0.4,
    outOfRing: false,

    blocks: [],
    spawnIn: 1.4,
    blockSeq: 0,
    blockLevel: 0,

    rule: makeRule(0),
    ruleIn: 15,
    ruleLevel: 0,

    math: makeMath(0),
    mathLevel: 0,

    effects: [],

    goodFlash: 0,
    badFlash: 0,

    lastTs: 0,
  };
}

type Snapshot = {
  status: GameState["status"];
  score: number;
  best: number;
  stability: number;
  elapsed: number;
  math: MathQ;
  ruleLabel: string;
  ruleIn: number;
};

function snapshot(g: GameState): Snapshot {
  return {
    status: g.status,
    score: g.score,
    best: g.best,
    stability: g.stability,
    elapsed: g.elapsed,
    math: { ...g.math },
    ruleLabel: g.rule.label,
    ruleIn: g.ruleIn,
  };
}

const EMPTY_SNAP: Snapshot = {
  status: "idle",
  score: 0,
  best: 0,
  stability: 100,
  elapsed: 0,
  math: {
    q: "",
    a: 0,
    input: "",
    timeLeft: 0,
    maxTime: 1,
    state: "input",
    hold: 0,
  },
  ruleLabel: "",
  ruleIn: 0,
};

export default function SplitFocus() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(freshState(0));
  const [snap, setSnap] = useState<Snapshot>(EMPTY_SNAP);
  const syncSnapRef = useRef<() => void>(() => {});

  useEffect(() => {
    syncSnapRef.current = () => setSnap(snapshot(stateRef.current));
    syncSnapRef.current();
    const id = setInterval(() => syncSnapRef.current(), 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;
    ctx.scale(dpr, dpr);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const g = stateRef.current;
      g.mouseX = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
      g.mouseY = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
    };
    canvas.addEventListener("mousemove", onMove);

    const tryPress = () => {
      const g = stateRef.current;
      if (g.status !== "running") return;
      const inWindow = g.blocks.filter(
        (b) => !b.consumed && Math.abs(b.y - LINE_Y) <= LINE_WINDOW,
      );
      const rulish = inWindow.filter((b) => g.rule.matches(b));
      if (rulish.length === 0) {
        g.stability -= 6;
        g.badFlash = 0.3;
        addEffect(g.effects, {
          x: g.cx,
          y: g.cy - 24,
          color: "#ff5e7a",
          text: "-6 WRONG",
        });
        return;
      }
      for (const b of rulish) {
        b.consumed = true;
        b.scored = true;
        if (g.rule.mode === "press") {
          g.score += 20;
          g.stability = Math.min(100, g.stability + 4);
          g.goodFlash = 0.25;
          addEffect(g.effects, {
            x: b.x,
            y: b.y,
            color: "#46f0a0",
            text: "+20",
          });
        } else {
          g.stability -= 12;
          g.badFlash = 0.35;
          addEffect(g.effects, {
            x: b.x,
            y: b.y,
            color: "#ff5e7a",
            text: "-12",
          });
        }
      }
    };

    const submitMath = () => {
      const g = stateRef.current;
      if (g.status !== "running") return;
      if (g.math.state !== "input") return;
      if (g.math.input === "") return;
      const guess = parseInt(g.math.input, 10);
      if (guess === g.math.a) {
        g.score += 30;
        g.stability = Math.min(100, g.stability + 14);
        g.goodFlash = 0.3;
        g.math.state = "correct";
        g.math.hold = 0.7;
        addEffect(g.effects, {
          x: RING_CX,
          y: RING_CY - 140,
          color: "#46f0a0",
          text: "+14 SOLVED",
          ttl: 1.1,
        });
      } else {
        g.stability -= 10;
        g.badFlash = 0.35;
        g.math.state = "wrong";
        g.math.hold = 0.55;
        addEffect(g.effects, {
          x: RING_CX,
          y: RING_CY - 140,
          color: "#ff5e7a",
          text: "-10 WRONG",
          ttl: 1.0,
        });
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const g = stateRef.current;
      if (g.status === "idle" || g.status === "over") {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          const best = Math.max(g.best, Math.floor(g.score));
          stateRef.current = freshState(best);
          stateRef.current.status = "running";
          syncSnapRef.current();
        }
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        tryPress();
        return;
      }
      if (e.code === "Enter") {
        e.preventDefault();
        submitMath();
        return;
      }
      if (g.math.state !== "input") return;
      if (e.code === "Backspace") {
        e.preventDefault();
        g.math.input = g.math.input.slice(0, -1);
        return;
      }
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        if (g.math.input.length < 4) g.math.input += e.key;
        return;
      }
    };
    window.addEventListener("keydown", onKey);

    let raf = 0;

    const step = (ts: number) => {
      const g = stateRef.current;
      if (!g.lastTs) g.lastTs = ts;
      let dt = (ts - g.lastTs) / 1000;
      g.lastTs = ts;
      if (dt > 0.05) dt = 0.05;

      if (g.status === "running") {
        g.elapsed += dt;
        g.score += dt * 4;

        g.driftIn -= dt;
        if (g.driftIn <= 0) {
          const strength = 220 + Math.min(g.elapsed * 4, 260);
          const ang = Math.random() * Math.PI * 2;
          g.driftX = Math.cos(ang) * strength;
          g.driftY = Math.sin(ang) * strength;
          g.driftIn = 0.35 + Math.random() * 0.5;
        }

        const k = 16;
        const damp = 6;
        const ax = k * (g.mouseX - g.cx) + g.driftX - damp * g.vx;
        const ay = k * (g.mouseY - g.cy) + g.driftY - damp * g.vy;
        g.vx += ax * dt;
        g.vy += ay * dt;
        g.cx += g.vx * dt;
        g.cy += g.vy * dt;

        const dx = g.cx - RING_CX;
        const dy = g.cy - RING_CY;
        const distSq = dx * dx + dy * dy;
        g.outOfRing = distSq > RING_R * RING_R;
        if (g.outOfRing) {
          g.stability -= 24 * dt;
          g.badFlash = Math.max(g.badFlash, 0.15);
        }

        g.stability -= 0.5 * dt;

        g.ruleIn -= dt;
        if (g.ruleIn <= 0) {
          g.ruleLevel += 1;
          g.rule = makeRule(g.ruleLevel);
          g.ruleIn = Math.max(9, 15 - g.ruleLevel * 0.5);
        }

        g.spawnIn -= dt;
        if (g.spawnIn <= 0) {
          g.blockSeq += 1;
          g.blockLevel = g.elapsed / 15;
          g.blocks.push(makeBlock(g.blockSeq, g.blockLevel));
          g.spawnIn = Math.max(0.55, 1.5 - g.blockLevel * 0.12);
        }

        for (const b of g.blocks) {
          const prevY = b.y;
          b.y += b.vy * dt;
          if (
            !b.scored &&
            !b.consumed &&
            b.y > LINE_Y + LINE_WINDOW &&
            prevY <= LINE_Y + LINE_WINDOW
          ) {
            const matches = g.rule.matches(b);
            if (g.rule.mode === "press" && matches) {
              g.stability -= 10;
              g.badFlash = Math.max(g.badFlash, 0.3);
              addEffect(g.effects, {
                x: b.x,
                y: LINE_Y,
                color: "#ff5e7a",
                text: "-10 MISS",
              });
            } else if (g.rule.mode === "skip" && matches) {
              g.score += 12;
              g.stability = Math.min(100, g.stability + 2);
              addEffect(g.effects, {
                x: b.x,
                y: LINE_Y,
                color: "#22e0ff",
                text: "+12",
                ttl: 0.7,
              });
            }
            b.scored = true;
          }
        }
        g.blocks = g.blocks.filter((b) => b.y < RING_CY + RING_R + 30);

        if (g.math.state === "input") {
          g.math.timeLeft -= dt;
          if (g.math.timeLeft <= 0) {
            g.stability -= 15;
            g.badFlash = Math.max(g.badFlash, 0.35);
            g.math.state = "wrong";
            g.math.hold = 0.55;
            g.math.input = String(g.math.a);
          }
        } else {
          g.math.hold -= dt;
          if (g.math.hold <= 0) {
            if (g.math.state === "correct") g.mathLevel += 0.35;
            g.math = makeMath(g.mathLevel);
          }
        }

        for (const eff of g.effects) {
          eff.age += dt;
          eff.y += eff.vy * dt;
          eff.vy *= 1 - dt * 1.4;
          eff.ringR += 120 * dt;
        }
        g.effects = g.effects.filter((eff) => eff.age < eff.ttl);

        if (g.goodFlash > 0) g.goodFlash = Math.max(0, g.goodFlash - dt);
        if (g.badFlash > 0) g.badFlash = Math.max(0, g.badFlash - dt);

        if (g.stability <= 0) {
          g.stability = 0;
          g.status = "over";
          g.best = Math.max(g.best, Math.floor(g.score));
          syncSnapRef.current();
        }
      }

      draw(ctx, g);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "stretch",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <StabilityBar value={Math.max(0, snap.stability)} />
        <Stat label="SCORE" value={Math.floor(snap.score).toString()} />
        <Stat label="TIME" value={`${snap.elapsed.toFixed(1)}s`} />
        <Stat label="BEST" value={snap.best.toString()} />
      </div>

      <div
        style={{
          position: "relative",
          border: "1px solid rgba(255,45,156,.25)",
          boxShadow: "0 0 40px rgba(255,45,156,.12)",
          background: "linear-gradient(180deg,#0c0716,#0a0510)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 12,
            right: 12,
            display: "flex",
            gap: 12,
            alignItems: "stretch",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <MathPanel math={snap.math} />
          <RulePanel rule={snap.ruleLabel} timeLeft={snap.ruleIn} />
        </div>

        <canvas ref={canvasRef} style={{ display: "block", cursor: "none" }} />

        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            opacity: 0.3,
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,.5) 3px, rgba(0,0,0,0) 4px)",
          }}
        />

        {snap.status !== "running" && (
          <div
            onClick={() => {
              const g = stateRef.current;
              const best = Math.max(g.best, Math.floor(g.score));
              stateRef.current = freshState(best);
              stateRef.current.status = "running";
              syncSnapRef.current();
            }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(4,3,10,.82)",
              padding: 24,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            {snap.status === "idle" ? (
              <IdleScreen />
            ) : (
              <OverScreen
                score={Math.floor(snap.score)}
                best={snap.best}
                elapsed={snap.elapsed}
              />
            )}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 11,
          letterSpacing: ".14em",
          color: "#6a6a76",
        }}
      >
        <span>◆ MOUSE — stay inside the ring</span>
        <span>◆ SPACE — trigger on matching block at the line</span>
        <span>◆ 0-9 / ENTER — solve the math</span>
      </div>
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, g: GameState) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  bg.addColorStop(0, "#0c0716");
  bg.addColorStop(1, "#0a0510");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (g.badFlash > 0) {
    ctx.fillStyle = `rgba(255,94,122,${0.18 * (g.badFlash / 0.35)})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
  if (g.goodFlash > 0) {
    ctx.fillStyle = `rgba(70,240,160,${0.14 * (g.goodFlash / 0.2)})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(RING_CX, RING_CY, RING_R, 0, Math.PI * 2);
  ctx.clip();

  ctx.strokeStyle = "rgba(255,255,255,.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(RING_CX - RING_R, LINE_Y);
  ctx.lineTo(RING_CX + RING_R, LINE_Y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(34,224,255,.5)";
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(RING_CX - RING_R, LINE_Y);
  ctx.lineTo(RING_CX + RING_R, LINE_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  for (const b of g.blocks) {
    if (b.consumed) continue;
    drawBlock(ctx, b);
  }

  ctx.restore();

  ctx.lineWidth = 2;
  const ringColor = g.outOfRing
    ? "#ff5e7a"
    : g.status === "running"
      ? "#ff2d9c"
      : "rgba(255,45,156,.55)";
  ctx.strokeStyle = ringColor;
  ctx.shadowColor = ringColor;
  ctx.shadowBlur = g.outOfRing ? 22 : 14;
  ctx.beginPath();
  ctx.arc(RING_CX, RING_CY, RING_R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  if (g.status === "running") {
    const outside = g.outOfRing;
    const c = outside ? "#ff5e7a" : "#22e0ff";
    ctx.fillStyle = c;
    ctx.shadowColor = c;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(g.cx, g.cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(255,255,255,.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(g.cx - 14, g.cy);
    ctx.lineTo(g.cx - 4, g.cy);
    ctx.moveTo(g.cx + 4, g.cy);
    ctx.lineTo(g.cx + 14, g.cy);
    ctx.moveTo(g.cx, g.cy - 14);
    ctx.lineTo(g.cx, g.cy - 4);
    ctx.moveTo(g.cx, g.cy + 4);
    ctx.lineTo(g.cx, g.cy + 14);
    ctx.stroke();
  }

  for (const eff of g.effects) {
    const life = 1 - eff.age / eff.ttl;
    ctx.save();
    ctx.globalAlpha = Math.min(1, life * 1.5);
    ctx.strokeStyle = eff.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(eff.x, eff.y + eff.age * 30, eff.ringR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '700 18px "Chakra Petch", sans-serif';
    ctx.textAlign = "center";
    ctx.fillStyle = eff.color;
    ctx.shadowColor = eff.color;
    ctx.shadowBlur = 14;
    ctx.fillText(eff.text, eff.x, eff.y);
    ctx.restore();
  }

  if (g.status === "running" && g.stability < 40) {
    const t = 1 - Math.max(0, g.stability) / 40;
    const grad = ctx.createRadialGradient(
      CANVAS_W / 2,
      CANVAS_H / 2,
      Math.min(CANVAS_W, CANVAS_H) * 0.25,
      CANVAS_W / 2,
      CANVAS_H / 2,
      Math.max(CANVAS_W, CANVAS_H) * 0.7,
    );
    const pulse = 0.6 + 0.4 * Math.sin(g.elapsed * 6);
    grad.addColorStop(0, "rgba(255,94,122,0)");
    grad.addColorStop(1, `rgba(255,94,122,${0.55 * t * pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}

function drawBlock(ctx: CanvasRenderingContext2D, b: Block) {
  const color = COLORS[b.color];
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  const size = 22;

  const cells = shapeCells(b.shape);
  for (const [dx, dy] of cells) {
    ctx.fillRect(b.x + dx * size - size / 2, b.y + dy * size - size / 2, size - 2, size - 2);
  }
  ctx.shadowBlur = 0;
}

function shapeCells(s: ShapeKey): Array<[number, number]> {
  switch (s) {
    case "I":
      return [
        [-1.5, 0],
        [-0.5, 0],
        [0.5, 0],
        [1.5, 0],
      ];
    case "S":
      return [
        [-1, 0.5],
        [0, 0.5],
        [0, -0.5],
        [1, -0.5],
      ];
    case "T":
      return [
        [-1, 0.5],
        [0, 0.5],
        [1, 0.5],
        [0, -0.5],
      ];
    case "L":
      return [
        [-0.5, -0.5],
        [-0.5, 0.5],
        [0.5, 0.5],
        [1.5, 0.5],
      ];
  }
}

function StabilityBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value / 100));
  const rounded = Math.round(value);
  const color =
    value > 60 ? "#46f0a0" : value > 30 ? "#ffcf5c" : "#ff5e7a";
  const critical = value <= 30;
  const segments = 20;
  const filled = Math.round(pct * segments);
  return (
    <div style={{ flex: 2.4, minWidth: 260 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 11,
            letterSpacing: ".16em",
            color: critical ? color : "#6a6a76",
            animation: critical ? "gl-pulse 0.9s ease-in-out infinite" : undefined,
          }}
        >
          STABILITY
        </span>
        <span
          style={{
            fontFamily: "var(--font-chakra-petch), sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color,
            textShadow: `0 0 12px ${color}88`,
            animation: critical
              ? "gl-pulse 0.9s ease-in-out infinite"
              : undefined,
          }}
        >
          {rounded}
          <span
            style={{
              fontSize: 12,
              color: "#6a6a76",
              marginLeft: 3,
              fontWeight: 500,
            }}
          >
            /100
          </span>
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 3,
          height: 22,
          border: "1px solid rgba(255,255,255,.15)",
          padding: 3,
          background: "rgba(0,0,0,.5)",
        }}
      >
        {Array.from({ length: segments }).map((_, i) => {
          const on = i < filled;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: on ? color : "rgba(255,255,255,.05)",
                boxShadow: on ? `0 0 8px ${color}66` : "none",
                transition: "background .15s",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 100 }}>
      <div
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 11,
          letterSpacing: ".16em",
          color: "#6a6a76",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-chakra-petch), sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: "#fff",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MathPanel({ math }: { math: MathQ }) {
  const pct = Math.max(0, math.timeLeft / math.maxTime);
  const critical = math.state === "input" && pct < 0.3;
  const isCorrect = math.state === "correct";
  const isWrong = math.state === "wrong";

  const accent = isCorrect
    ? "#46f0a0"
    : isWrong
      ? "#ff5e7a"
      : critical
        ? "#ff5e7a"
        : "#22e0ff";

  const label = isCorrect ? "✓ CORRECT" : isWrong ? "✗ WRONG" : "▚ SOLVE";
  const inputColor = isCorrect
    ? "#46f0a0"
    : isWrong
      ? "#ff5e7a"
      : math.input
        ? "#22e0ff"
        : "rgba(255,255,255,.25)";

  return (
    <div
      style={{
        flex: 1,
        background: isCorrect
          ? "rgba(70,240,160,.08)"
          : isWrong
            ? "rgba(255,94,122,.08)"
            : "rgba(0,0,0,.6)",
        border: `1px solid ${
          isCorrect
            ? "rgba(70,240,160,.55)"
            : isWrong
              ? "rgba(255,94,122,.55)"
              : "rgba(34,224,255,.35)"
        }`,
        padding: "10px 14px",
        pointerEvents: "auto",
        transition: "background .15s, border-color .15s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 11,
            letterSpacing: ".2em",
            color: accent,
            textShadow: isCorrect || isWrong ? `0 0 10px ${accent}` : "none",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 11,
            color: critical ? "#ff5e7a" : "#8a8a95",
          }}
        >
          {math.state === "input" ? `${math.timeLeft.toFixed(1)}s` : ""}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          margin: "6px 0 8px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-chakra-petch), sans-serif",
            fontWeight: 700,
            fontSize: 28,
            color: "#fff",
            letterSpacing: ".04em",
          }}
        >
          {math.q} =
        </span>
        <span
          style={{
            fontFamily: "var(--font-chakra-petch), sans-serif",
            fontWeight: 700,
            fontSize: 28,
            minWidth: 90,
            textAlign: "right",
            color: inputColor,
            textShadow:
              isCorrect || isWrong || math.input ? `0 0 14px ${inputColor}` : "none",
          }}
        >
          {math.input || "___"}
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: "rgba(255,255,255,.08)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${(isCorrect || isWrong ? 1 : pct) * 100}%`,
            background: accent,
            boxShadow: `0 0 10px ${accent}`,
            transition: "background .15s",
          }}
        />
      </div>
    </div>
  );
}

function RulePanel({ rule, timeLeft }: { rule: string; timeLeft: number }) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(0,0,0,.6)",
        border: "1px solid rgba(255,45,156,.35)",
        padding: "10px 14px",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 11,
            letterSpacing: ".2em",
            color: "#ff2d9c",
          }}
        >
          ▚ RULE
        </span>
        <span
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 11,
            color: "#8a8a95",
          }}
        >
          new in {Math.max(0, timeLeft).toFixed(0)}s
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-chakra-petch), sans-serif",
          fontWeight: 600,
          fontSize: 18,
          color: "#fff",
          marginTop: 6,
          lineHeight: 1.25,
          minHeight: 44,
        }}
      >
        {rule}
      </div>
    </div>
  );
}

function IdleScreen() {
  return (
    <>
      <div
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 12,
          letterSpacing: ".24em",
          color: "#22e0ff",
          marginBottom: 12,
        }}
      >
        ▚ READY
      </div>
      <div
        style={{
          fontFamily: "var(--font-chakra-petch), sans-serif",
          fontWeight: 700,
          fontSize: 48,
          color: "#fff",
          letterSpacing: "-.01em",
          textShadow: "0 0 30px rgba(255,45,156,.4)",
        }}
      >
        PRESS <span style={{ color: "#22e0ff" }}>SPACE</span> TO START
      </div>
      <div
        style={{
          marginTop: 20,
          maxWidth: 520,
          color: "#b7b7c4",
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        Keep the crosshair inside the ring. Hit <kbd style={kbdStyle}>SPACE</kbd>{" "}
        when a matching block crosses the line. Type the math answer, submit
        with <kbd style={kbdStyle}>ENTER</kbd>. Rules change every 15s.
      </div>
    </>
  );
}

function OverScreen({
  score,
  best,
  elapsed,
}: {
  score: number;
  best: number;
  elapsed: number;
}) {
  const isNewBest = score >= best;
  return (
    <>
      <div
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 12,
          letterSpacing: ".24em",
          color: "#ff2d9c",
          marginBottom: 12,
        }}
      >
        ▚ STABILITY LOST
      </div>
      <div
        style={{
          fontFamily: "var(--font-chakra-petch), sans-serif",
          fontWeight: 700,
          fontSize: 44,
          color: "#fff",
          letterSpacing: "-.01em",
        }}
      >
        SCORE <span style={{ color: "#22e0ff" }}>{score}</span>
      </div>
      {isNewBest && (
        <div
          style={{
            marginTop: 6,
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 12,
            letterSpacing: ".2em",
            color: "#46f0a0",
          }}
        >
          ◆ NEW BEST
        </div>
      )}
      <div
        style={{
          marginTop: 4,
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 12,
          color: "#8a8a95",
          letterSpacing: ".1em",
        }}
      >
        SURVIVED {elapsed.toFixed(1)}s
      </div>
      <div
        style={{
          marginTop: 24,
          fontFamily: "var(--font-chakra-petch), sans-serif",
          fontWeight: 700,
          fontSize: 22,
          color: "#fff",
        }}
      >
        PRESS <span style={{ color: "#22e0ff" }}>SPACE</span> TO RETRY
      </div>
    </>
  );
}

const kbdStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.35)",
  padding: "1px 6px",
  fontFamily: "var(--font-ibm-plex-mono), monospace",
  fontSize: 12,
};
