"use client";

import { useEffect, useRef, useState } from "react";

const CANVAS_W = 900;
const CANVAS_H = 620;
const RING_CX = CANVAS_W / 2;
const RING_CY = CANVAS_H / 2 + 20;
const RING_R = 230;
const LINE_Y = RING_CY + 40;
const LINE_WINDOW = 40;

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
  partialLeft: number;
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

  ruleFlash: number;

  effects: Effect[];

  goodFlash: number;
  badFlash: number;

  lastTs: number;
};

const SHAPES: ShapeKey[] = ["I", "S", "T", "L"];
const COLOR_KEYS: ColorKey[] = ["M", "C", "G", "A"];
const COLOR_LABEL: Record<ColorKey, string> = {
  M: "PINK",
  C: "BLUE",
  G: "GREEN",
  A: "YELLOW",
};
const SHAPE_LABEL: Record<ShapeKey, string> = {
  I: "LINE",
  S: "STEP",
  T: "PEAK",
  L: "HOOK",
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function makeRule(level: number): Rule {
  if (level < 3) {
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
  if (level < 6) {
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
  const maxTime = Math.max(4.5, 10 - level * 0.35);
  let a: number, b: number, op: string, ans: number;
  if (level < 2) {
    a = 1 + Math.floor(Math.random() * 9);
    b = 1 + Math.floor(Math.random() * 9);
    op = "+";
    ans = a + b;
  } else if (level < 4) {
    a = 10 + Math.floor(Math.random() * 40);
    b = 1 + Math.floor(Math.random() * 9);
    op = "+";
    ans = a + b;
  } else if (level < 6) {
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
  } else if (level < 8) {
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
    partialLeft: 0,
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
  const speed = 70 + level * 10;
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
    spawnIn: 1.8,
    blockSeq: 0,
    blockLevel: 0,

    rule: makeRule(0),
    ruleIn: 20,
    ruleLevel: 0,

    math: makeMath(0),
    mathLevel: 0,

    ruleFlash: 0,

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
  ruleFlash: number;
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
    ruleFlash: g.ruleFlash,
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
    partialLeft: 0,
  },
  ruleLabel: "",
  ruleIn: 0,
  ruleFlash: 0,
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
      const inWindow = g.blocks
        .filter((b) => !b.consumed && Math.abs(b.y - LINE_Y) <= LINE_WINDOW)
        .sort((a, b) => Math.abs(a.y - LINE_Y) - Math.abs(b.y - LINE_Y));
      if (inWindow.length === 0) {
        g.stability -= 4;
        g.badFlash = 0.3;
        addEffect(g.effects, {
          x: g.cx,
          y: g.cy - 24,
          color: "#ff5e7a",
          text: "-4 MISTIMED",
        });
        return;
      }
      const b = inWindow[0]!;
      const matches = g.rule.matches(b);
      const shouldPress = g.rule.mode === "press" ? matches : !matches;
      b.consumed = true;
      b.scored = true;
      if (shouldPress) {
        g.score += 20;
        g.goodFlash = 0.25;
        addEffect(g.effects, {
          x: b.x,
          y: b.y,
          color: "#46f0a0",
          text: "+20",
        });
      } else {
        g.stability -= 6;
        g.badFlash = 0.35;
        addEffect(g.effects, {
          x: b.x,
          y: b.y,
          color: "#ff5e7a",
          text: "-6",
        });
      }
    };

    const acceptMathCorrect = () => {
      const g = stateRef.current;
      g.score += 30;
      g.goodFlash = 0.3;
      g.math.state = "correct";
      g.math.partialLeft = 0;
      addEffect(g.effects, {
        x: RING_CX,
        y: RING_CY - 140,
        color: "#46f0a0",
        text: "+30 SOLVED",
        ttl: 1.1,
      });
    };

    const failMath = (penalty: number, popupText: string) => {
      const g = stateRef.current;
      g.stability -= penalty;
      g.badFlash = 0.35;
      g.math.state = "wrong";
      g.math.hold = 0.55;
      g.math.input = "";
      g.math.partialLeft = 0;
      addEffect(g.effects, {
        x: RING_CX,
        y: RING_CY - 140,
        color: "#ff5e7a",
        text: popupText,
        ttl: 1.0,
      });
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
      if (g.math.state !== "input") return;
      if (e.code === "Backspace") {
        e.preventDefault();
        g.math.input = g.math.input.slice(0, -1);
        if (g.math.input.length === 0) g.math.partialLeft = 0;
        return;
      }
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        if (g.math.input.length >= 4) return;
        const answerStr = String(g.math.a);
        const nextInput = g.math.input + e.key;
        if (nextInput === answerStr) {
          g.math.input = nextInput;
          acceptMathCorrect();
        } else if (answerStr.startsWith(nextInput)) {
          g.math.input = nextInput;
          g.math.partialLeft = 3;
        } else {
          failMath(8, "-8 WRONG");
        }
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
          const strength = 160 + Math.min(g.elapsed * 1.5, 180);
          const ang = Math.random() * Math.PI * 2;
          g.driftX = Math.cos(ang) * strength;
          g.driftY = Math.sin(ang) * strength;
          g.driftIn = 0.45 + Math.random() * 0.5;
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
          g.ruleIn = Math.max(12, 20 - g.ruleLevel * 0.4);
          g.ruleFlash = 1.6;
          addEffect(g.effects, {
            x: RING_CX,
            y: RING_CY - 40,
            color: "#ff2d9c",
            text: "! NEW RULE !",
            ttl: 1.6,
          });
        }
        if (g.ruleFlash > 0) g.ruleFlash = Math.max(0, g.ruleFlash - dt);

        g.spawnIn -= dt;
        if (g.spawnIn <= 0) {
          g.blockSeq += 1;
          g.blockLevel = g.elapsed / 22;
          g.blocks.push(makeBlock(g.blockSeq, g.blockLevel));
          g.spawnIn = Math.max(0.75, 1.8 - g.blockLevel * 0.1);
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
            const shouldPress =
              g.rule.mode === "press" ? matches : !matches;
            if (shouldPress) {
              g.stability -= 7;
              g.badFlash = Math.max(g.badFlash, 0.3);
              addEffect(g.effects, {
                x: b.x,
                y: LINE_Y,
                color: "#ff5e7a",
                text: "-7 MISS",
              });
            } else {
              g.score += 8;
              addEffect(g.effects, {
                x: b.x,
                y: LINE_Y,
                color: "#22e0ff",
                text: "+8",
                ttl: 0.7,
              });
            }
            b.scored = true;
          }
        }
        g.blocks = g.blocks.filter((b) => b.y < RING_CY + RING_R + 30);

        if (g.math.state === "input") {
          g.math.timeLeft -= dt;
          if (g.math.partialLeft > 0) {
            g.math.partialLeft -= dt;
            if (g.math.partialLeft <= 0 && g.math.input.length > 0) {
              failMath(8, "-8 TOO SLOW");
            }
          }
          if (g.math.state === "input" && g.math.timeLeft <= 0) {
            failMath(12, "-12 TIMEOUT");
          }
        } else if (g.math.state === "correct") {
          g.math.timeLeft -= dt;
          if (g.math.timeLeft <= 0) {
            g.mathLevel += 0.22;
            g.math = makeMath(g.mathLevel);
          }
        } else {
          g.math.hold -= dt;
          if (g.math.hold <= 0) {
            g.math = makeMath(g.mathLevel);
          }
        }

        for (const eff of g.effects) {
          eff.age += dt;
          eff.y += eff.vy * dt;
          eff.vy *= 1 - dt * 1.4;
          eff.ringR += 55 * dt;
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
          <RulePanel
            rule={snap.ruleLabel}
            timeLeft={snap.ruleIn}
            flash={snap.ruleFlash}
          />
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
          padding: "10px 14px",
          border: "1px solid rgba(255,255,255,.08)",
          background: "rgba(0,0,0,.35)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            alignItems: "center",
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 11,
            letterSpacing: ".14em",
            color: "#c3c3ce",
          }}
        >
          <span style={{ color: "#6a6a76", minWidth: 60 }}>SHAPES</span>
          {(["I", "S", "T", "L"] as const).map((s) => (
            <span
              key={s}
              style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
            >
              <ShapeIcon shape={s} />
              {SHAPE_LABEL[s]}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            alignItems: "center",
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 11,
            letterSpacing: ".14em",
            color: "#c3c3ce",
          }}
        >
          <span style={{ color: "#6a6a76", minWidth: 60 }}>COLORS</span>
          {(["M", "C", "G", "A"] as const).map((c) => (
            <span
              key={c}
              style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  background: COLORS[c],
                  boxShadow: `0 0 8px ${COLORS[c]}88`,
                  display: "inline-block",
                }}
              />
              {COLOR_LABEL[c]}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
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
        <span>◆ 0-9 — type the math answer (auto-submits when correct)</span>
      </div>
    </div>
  );
}

function ShapeIcon({ shape }: { shape: ShapeKey }) {
  const cells = shapeCells(shape);
  const cellSize = 7;
  const minX = Math.min(...cells.map((c) => c[0])) - 0.5;
  const maxX = Math.max(...cells.map((c) => c[0])) + 0.5;
  const minY = Math.min(...cells.map((c) => c[1])) - 0.5;
  const maxY = Math.max(...cells.map((c) => c[1])) + 0.5;
  const w = (maxX - minX) * cellSize;
  const h = (maxY - minY) * cellSize;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {cells.map(([dx, dy], i) => (
        <rect
          key={i}
          x={(dx - minX - 0.5) * cellSize}
          y={(dy - minY - 0.5) * cellSize}
          width={cellSize - 1}
          height={cellSize - 1}
          fill="#c3c3ce"
        />
      ))}
    </svg>
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

  const zoneGrad = ctx.createLinearGradient(
    0,
    LINE_Y - LINE_WINDOW,
    0,
    LINE_Y + LINE_WINDOW,
  );
  zoneGrad.addColorStop(0, "rgba(34,224,255,0)");
  zoneGrad.addColorStop(0.5, "rgba(34,224,255,.09)");
  zoneGrad.addColorStop(1, "rgba(34,224,255,0)");
  ctx.fillStyle = zoneGrad;
  ctx.fillRect(
    RING_CX - RING_R,
    LINE_Y - LINE_WINDOW,
    RING_R * 2,
    LINE_WINDOW * 2,
  );

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
    ctx.globalAlpha = Math.min(1, life * 0.55);
    ctx.strokeStyle = eff.color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(eff.x, eff.y + eff.age * 30, eff.ringR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = Math.min(1, life * 1.5);
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
          justifyContent: isCorrect || isWrong ? "center" : "space-between",
          gap: 14,
          margin: "6px 0 8px",
          minHeight: 40,
        }}
      >
        {isCorrect ? (
          <span
            style={{
              fontFamily: "var(--font-chakra-petch), sans-serif",
              fontWeight: 700,
              fontSize: 30,
              color: "#46f0a0",
              textShadow: "0 0 18px rgba(70,240,160,.7)",
              letterSpacing: ".14em",
            }}
          >
            ✓ SOLVED
          </span>
        ) : isWrong ? (
          <span
            style={{
              fontFamily: "var(--font-chakra-petch), sans-serif",
              fontWeight: 700,
              fontSize: 30,
              color: "#ff5e7a",
              textShadow: "0 0 18px rgba(255,94,122,.75)",
              letterSpacing: ".14em",
            }}
          >
            ✗ WRONG
          </span>
        ) : (
          <>
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
                textShadow: math.input ? `0 0 14px ${inputColor}` : "none",
              }}
            >
              {math.input || "___"}
            </span>
          </>
        )}
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

function RulePanel({
  rule,
  timeLeft,
  flash,
}: {
  rule: string;
  timeLeft: number;
  flash: number;
}) {
  const flashing = flash > 0;
  return (
    <div
      style={{
        flex: 1,
        background: flashing ? "rgba(255,45,156,.18)" : "rgba(0,0,0,.6)",
        border: flashing
          ? "2px solid #ff2d9c"
          : "1px solid rgba(255,45,156,.35)",
        boxShadow: flashing
          ? "0 0 32px rgba(255,45,156,.7)"
          : "none",
        padding: flashing ? "9px 13px" : "10px 14px",
        pointerEvents: "auto",
        animation: flashing
          ? "gl-pulse 0.35s ease-in-out infinite"
          : undefined,
        transition: "background .25s, box-shadow .25s",
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
            textShadow: flashing ? "0 0 12px rgba(255,45,156,.9)" : "none",
          }}
        >
          {flashing ? "! NEW RULE !" : "▚ RULE"}
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
        when a matching block crosses the line. Type the math answer — it
        submits automatically the moment you enter the correct number. Rules
        change every 15s.
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
