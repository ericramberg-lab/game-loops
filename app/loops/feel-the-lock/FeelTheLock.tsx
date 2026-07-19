"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  configFor,
  generateLock,
  updateLock,
  randomSeed,
  type Difficulty,
  type LockState,
  type LockEvent,
} from "./lockModel";
import { LockAudio } from "./audio";

const CANVAS_W = 900;
const CANVAS_H = 480;

const HOUSING_TOP = 60;
const SHEAR_Y = 250;
const CYL_BOTTOM = 400;
const PIN_LEFT = 200;
const PIN_RIGHT = 700;

const COLORS = {
  bgTop: "#0c0716",
  bgBot: "#0a0510",
  housing: "#1a1420",
  cyl: "#20182b",
  cylEdge: "#3a2c48",
  shear: "rgba(34,224,255,.35)",
  pinDriver: "#3b3346",
  pinKey: "#a58b6a",
  pinKeyBind: "#ffcf5c",
  pinKeySet: "#46f0a0",
  pinKeyFalse: "#22e0ff",
  pinKeyOver: "#ff5e7a",
  spring: "rgba(255,255,255,.35)",
  pick: "#e6d4a8",
  pickTension: "#ff5e7a",
  wrench: "#8f6a3a",
  wrenchStress: "#ff5e7a",
  seed: "#4a4459",
};

type UIStatus = "idle" | "playing" | "opened" | "failed";

type Session = {
  difficulty: Difficulty;
  seed: number;
  state: LockState;
  status: UIStatus;
};

function fmtTime(ms: number): string {
  if (ms <= 0) return "0.00s";
  return `${(ms / 1000).toFixed(2)}s`;
}

function scoreFor(state: LockState): number {
  const timeSec = state.elapsed / 1000;
  const base =
    state.config.difficulty === "hard"
      ? 3000
      : state.config.difficulty === "medium"
        ? 2000
        : 1200;
  const timePenalty = Math.min(base * 0.6, timeSec * 30);
  const oversetPenalty = state.oversetCount * 60;
  const droppedPenalty = state.droppedCount * 40;
  const brokenPenalty = state.picksBrokenCount * 120;
  const raw =
    base - timePenalty - oversetPenalty - droppedPenalty - brokenPenalty;
  return Math.max(0, Math.floor(raw));
}

function newSession(difficulty: Difficulty, seed: number): Session {
  const state = generateLock(configFor(difficulty, seed));
  return { difficulty, seed, state, status: "idle" };
}

export default function FeelTheLock() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<LockAudio | null>(null);

  const [session, setSession] = useState<Session>(() => newSession("easy", randomSeed()));
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [best, setBest] = useState<{ [k in Difficulty]?: number }>({});
  const [, setDisplayTick] = useState(0);

  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const inputRef = useRef({
    wantPickPos: 0,
    wantPickHeight: 0,
    wantTensionFromKey: 0,
    wantTensionFromTouch: 0,
    hasInputSinceStart: false,
    holdingSpace: false,
    holdingTouchTension: false,
    lastPointerInside: false,
  });
  const processedEventsRef = useRef(0);
  const lastVisualRef = useRef({ shakeUntil: 0, openedAnim: 0 });
  const rafRef = useRef(0);
  const drawRef = useRef<(state: LockState, now: number) => void>(() => {});

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new LockAudio();
    audioRef.current.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (m.matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReducedMotion(true);
    }
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    m.addEventListener("change", listener);
    return () => m.removeEventListener("change", listener);
  }, []);

  const setDifficulty = (difficulty: Difficulty) => {
    inputRef.current.hasInputSinceStart = false;
    processedEventsRef.current = 0;
    setSession(newSession(difficulty, randomSeed()));
  };

  const retry = () => {
    inputRef.current.hasInputSinceStart = false;
    processedEventsRef.current = 0;
    setSession((prev) => newSession(prev.difficulty, prev.seed));
  };

  const newLock = () => {
    inputRef.current.hasInputSinceStart = false;
    processedEventsRef.current = 0;
    setSession((prev) => newSession(prev.difficulty, randomSeed()));
  };

  const pinXFor = useCallback((state: LockState, pos: number) => {
    const n = state.config.pinCount;
    if (n === 1) return (PIN_LEFT + PIN_RIGHT) / 2;
    const step = (PIN_RIGHT - PIN_LEFT) / (n - 1);
    return PIN_LEFT + pos * step;
  }, []);

  const posFromCanvasX = useCallback((state: LockState, canvasX: number) => {
    const n = state.config.pinCount;
    if (n === 1) return 0;
    const step = (PIN_RIGHT - PIN_LEFT) / (n - 1);
    const raw = (canvasX - PIN_LEFT) / step;
    return Math.max(0, Math.min(n - 1, raw));
  }, []);

  const heightFromCanvasY = useCallback((canvasY: number) => {
    const top = HOUSING_TOP + 30;
    const bot = CYL_BOTTOM - 30;
    const raw = 1 - (canvasY - top) / (bot - top);
    return Math.max(0, Math.min(1, raw));
  }, []);

  useEffect(() => {
    let last = performance.now();
    const step = (now: number) => {
      const dtRaw = (now - last) / 1000;
      last = now;
      const dt = Math.min(0.05, dtRaw);
      const s = sessionRef.current.state;

      const input = inputRef.current;
      const wantTension = Math.max(
        input.wantTensionFromKey,
        input.wantTensionFromTouch,
      );
      updateLock(s, dt, {
        wantPickPos: input.wantPickPos,
        wantPickHeight: input.wantPickHeight,
        wantTension,
        now,
        hasInputSinceStart: input.hasInputSinceStart,
      });

      const audio = audioRef.current;
      const canVib =
        !reducedMotion &&
        typeof navigator !== "undefined" &&
        typeof navigator.vibrate === "function";

      while (processedEventsRef.current < s.events.length) {
        const ev = s.events[processedEventsRef.current++]!;
        if (audio && !muted) processEvent(audio, ev);
        if (canVib) doVibrate(ev);
        if (ev.kind === "opened") {
          lastVisualRef.current.openedAnim = now;
          const scored = scoreFor(s);
          setBest((prev) => {
            const key = sessionRef.current.difficulty;
            const b = prev[key] ?? 0;
            return scored > b ? { ...prev, [key]: scored } : prev;
          });
          setSession((prev) => ({ ...prev, status: "opened" }));
        } else if (ev.kind === "pickBroken") {
          lastVisualRef.current.shakeUntil = now + 260;
        }
      }
      if (s.failed && sessionRef.current.status !== "failed") {
        setSession((prev) => ({ ...prev, status: "failed" }));
      } else if (
        s.startedAt !== null &&
        !s.opened &&
        !s.failed &&
        sessionRef.current.status === "idle"
      ) {
        setSession((prev) => ({ ...prev, status: "playing" }));
      }

      drawRef.current(s, now);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [muted, reducedMotion]);

  useEffect(() => {
    const id = setInterval(() => setDisplayTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
      const cy = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
      const st = sessionRef.current.state;
      inputRef.current.wantPickPos = posFromCanvasX(st, cx);
      inputRef.current.wantPickHeight = heightFromCanvasY(cy);
      inputRef.current.hasInputSinceStart = true;
      inputRef.current.lastPointerInside = true;
      audioRef.current?.resume();
    };
    const onLeave = () => {
      inputRef.current.lastPointerInside = false;
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [posFromCanvasX, heightFromCanvasY]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["Space", "KeyA", "KeyD", "KeyW", "KeyS", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.code)) {
        e.preventDefault();
      }
      const st = sessionRef.current.state;
      const cur = inputRef.current;
      audioRef.current?.resume();
      if (e.code === "Space" && !e.repeat) {
        cur.holdingSpace = true;
        cur.wantTensionFromKey = 0.5;
        cur.hasInputSinceStart = true;
      }
      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        cur.wantPickPos = Math.max(0, Math.round(cur.wantPickPos - 1));
        cur.hasInputSinceStart = true;
      }
      if (e.code === "KeyD" || e.code === "ArrowRight") {
        cur.wantPickPos = Math.min(
          st.config.pinCount - 1,
          Math.round(cur.wantPickPos + 1),
        );
        cur.hasInputSinceStart = true;
      }
      if (e.code === "KeyW" || e.code === "ArrowUp") {
        cur.wantPickHeight = Math.min(1, cur.wantPickHeight + 0.06);
        cur.hasInputSinceStart = true;
      }
      if (e.code === "KeyS" || e.code === "ArrowDown") {
        cur.wantPickHeight = Math.max(0, cur.wantPickHeight - 0.06);
        cur.hasInputSinceStart = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        inputRef.current.holdingSpace = false;
        inputRef.current.wantTensionFromKey = 0;
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeTouches = new Map<number, { role: "pick" | "tension" }>();
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      audioRef.current?.resume();
      const rect = canvas.getBoundingClientRect();
      for (const t of Array.from(e.changedTouches)) {
        const cx = ((t.clientX - rect.left) / rect.width) * CANVAS_W;
        const cy = ((t.clientY - rect.top) / rect.height) * CANVAS_H;
        const role: "pick" | "tension" = cx < CANVAS_W * 0.7 ? "pick" : "tension";
        activeTouches.set(t.identifier, { role });
        if (role === "pick") {
          const st = sessionRef.current.state;
          inputRef.current.wantPickPos = posFromCanvasX(st, cx);
          inputRef.current.wantPickHeight = heightFromCanvasY(cy);
          inputRef.current.hasInputSinceStart = true;
        } else {
          inputRef.current.holdingTouchTension = true;
          inputRef.current.wantTensionFromTouch = 0.5;
          inputRef.current.hasInputSinceStart = true;
        }
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      for (const t of Array.from(e.changedTouches)) {
        const info = activeTouches.get(t.identifier);
        if (!info) continue;
        const cx = ((t.clientX - rect.left) / rect.width) * CANVAS_W;
        const cy = ((t.clientY - rect.top) / rect.height) * CANVAS_H;
        if (info.role === "pick") {
          const st = sessionRef.current.state;
          inputRef.current.wantPickPos = posFromCanvasX(st, cx);
          inputRef.current.wantPickHeight = heightFromCanvasY(cy);
        } else {
          const tensionArea = { top: 60, bot: CANVAS_H - 60 };
          const yInside = Math.max(
            tensionArea.top,
            Math.min(tensionArea.bot, cy),
          );
          const t01 = 1 - (yInside - tensionArea.top) / (tensionArea.bot - tensionArea.top);
          inputRef.current.wantTensionFromTouch = t01;
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (const t of Array.from(e.changedTouches)) {
        const info = activeTouches.get(t.identifier);
        if (info?.role === "tension") {
          inputRef.current.holdingTouchTension = false;
          inputRef.current.wantTensionFromTouch = 0;
        }
        activeTouches.delete(t.identifier);
      }
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [posFromCanvasX, heightFromCanvasY]);

  const draw = useCallback(
    (state: LockState, now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const shake =
        !reducedMotion && lastVisualRef.current.shakeUntil > now
          ? (Math.random() - 0.5) * 6
          : 0;

      ctx.save();
      ctx.translate(shake, shake * 0.5);

      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, COLORS.bgTop);
      bg.addColorStop(1, COLORS.bgBot);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = COLORS.housing;
      ctx.fillRect(120, HOUSING_TOP, CANVAS_W - 240, 260);

      const rot = state.cylinderRotation * 0.35 + (state.tension * 0.06);
      ctx.save();
      ctx.translate((PIN_LEFT + PIN_RIGHT) / 2, SHEAR_Y);
      ctx.rotate(rot * 0.4);
      ctx.translate(-(PIN_LEFT + PIN_RIGHT) / 2, -SHEAR_Y);

      ctx.fillStyle = COLORS.cyl;
      ctx.fillRect(140, SHEAR_Y - 12, CANVAS_W - 280, CYL_BOTTOM - SHEAR_Y + 12);
      ctx.strokeStyle = COLORS.cylEdge;
      ctx.lineWidth = 1;
      ctx.strokeRect(140, SHEAR_Y - 12, CANVAS_W - 280, CYL_BOTTOM - SHEAR_Y + 12);

      ctx.strokeStyle = COLORS.shear;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(140, SHEAR_Y);
      ctx.lineTo(CANVAS_W - 140, SHEAR_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      for (const pin of state.pins) {
        drawPin(ctx, state, pin, pinXFor(state, pin.id), now);
      }

      ctx.restore();

      const pickX = pinXFor(state, state.pickPos);
      const pickY = SHEAR_Y - state.pickHeight * (SHEAR_Y - HOUSING_TOP - 20);
      drawPick(ctx, pickX, pickY, state.pickStress);

      drawTensionWrench(ctx, state);
      drawStressAndTension(ctx, state);

      if (state.config.showHeightGuides) {
        drawHeightGuides(ctx, state, pinXFor);
      }

      drawSeed(ctx, state.config.seed, state.config.difficulty);

      ctx.restore();
    },
    [reducedMotion, pinXFor],
  );

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  const currentScore = scoreFor(session.state);
  const currentBest = best[session.difficulty] ?? 0;

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <TopBar
        difficulty={session.difficulty}
        seed={session.seed}
        muted={muted}
        reducedMotion={reducedMotion}
        onDifficulty={setDifficulty}
        onMute={() => setMuted((m) => !m)}
        onReducedMotion={() => setReducedMotion((r) => !r)}
      />

      <StatusRow
        elapsed={session.state.elapsed}
        pinsSet={session.state.pins.filter((p) => p.isSet).length}
        pinsTotal={session.state.config.pinCount}
        picksLeft={session.state.picksLeft}
        oversets={session.state.oversetCount}
        best={currentBest}
        score={currentScore}
      />

      <div
        style={{
          position: "relative",
          border: "1px solid rgba(255,45,156,.25)",
          boxShadow: "0 0 40px rgba(255,45,156,.12)",
          overflow: "hidden",
          background: COLORS.bgBot,
          touchAction: "none",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
            cursor: session.status === "idle" || session.status === "playing" ? "none" : "default",
          }}
        />
        {(session.status === "opened" || session.status === "failed") && (
          <ResultOverlay
            state={session.state}
            status={session.status}
            score={currentScore}
            best={currentBest}
            onRetry={retry}
            onNewLock={newLock}
          />
        )}
      </div>

      <ControlGuide />
    </div>
  );
}

function processEvent(audio: LockAudio, ev: LockEvent) {
  switch (ev.kind) {
    case "set":
      audio.setPin(ev.pinPitch ?? 1);
      break;
    case "falseSet":
      audio.falseSet(ev.pinPitch ?? 1);
      break;
    case "overset":
      audio.overset(ev.pinPitch ?? 1);
      break;
    case "scrape":
      audio.scrape(ev.pinPitch ?? 1, ev.intensity ?? 0.5);
      break;
    case "pickBroken":
      audio.pickBreak();
      break;
    case "opened":
      audio.opened();
      break;
    case "dropped":
      audio.overset(ev.pinPitch ?? 1);
      break;
  }
}

function doVibrate(ev: LockEvent) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  if (ev.kind === "set") navigator.vibrate(18);
  else if (ev.kind === "falseSet") navigator.vibrate([18, 30, 18]);
  else if (ev.kind === "pickBroken") navigator.vibrate(80);
  else if (ev.kind === "opened") navigator.vibrate([30, 40, 60]);
}

function drawPin(
  ctx: CanvasRenderingContext2D,
  state: LockState,
  pin: LockState["pins"][number],
  x: number,
  now: number,
) {
  const halfW = 14;
  const springTop = HOUSING_TOP + 8;
  const driverTop = HOUSING_TOP + 60;
  const keyBottom = CYL_BOTTOM - 20;

  const heightPx = pin.currentHeight * (keyBottom - SHEAR_Y);
  const keyTop = keyBottom - heightPx - 20;

  const driverBottom = keyTop - 2;
  const springCompress = 1 - Math.min(1, (driverBottom - driverTop) / (SHEAR_Y - driverTop));

  ctx.strokeStyle = COLORS.spring;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const springCount = 5;
  const springHeight = Math.max(6, (driverBottom - springTop) - springCompress * 10);
  for (let i = 0; i <= springCount * 2; i++) {
    const t = i / (springCount * 2);
    const y = springTop + t * springHeight;
    const sx = x + (i % 2 === 0 ? -6 : 6);
    if (i === 0) ctx.moveTo(sx, y);
    else ctx.lineTo(sx, y);
  }
  ctx.stroke();

  ctx.fillStyle = COLORS.pinDriver;
  ctx.fillRect(x - halfW, driverBottom - Math.max(0, driverBottom - driverTop), halfW * 2, Math.max(0, driverBottom - driverTop));

  let keyColor: string = COLORS.pinKey;
  const bindingId = findBindingPinIdVisual(state);
  if (pin.isSet) keyColor = COLORS.pinKeySet;
  else if (pin.isOverset) keyColor = COLORS.pinKeyOver;
  else if (pin.falseSet) keyColor = COLORS.pinKeyFalse;
  else if (pin.id === bindingId && state.config.showBindingPinHint) keyColor = COLORS.pinKeyBind;

  ctx.fillStyle = keyColor;
  ctx.fillRect(x - halfW, keyTop, halfW * 2, keyBottom - keyTop);

  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.fillRect(x - halfW, keyTop, 3, keyBottom - keyTop);

  if (pin.isSet) {
    const pulse = 0.7 + 0.3 * Math.sin(now / 200 + pin.id);
    ctx.strokeStyle = `rgba(70,240,160,${pulse * 0.7})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - halfW - 4, SHEAR_Y);
    ctx.lineTo(x + halfW + 4, SHEAR_Y);
    ctx.stroke();
  }
}

function findBindingPinIdVisual(state: LockState): number | null {
  const candidates = state.pins
    .filter((p) => !p.isSet)
    .sort((a, b) => a.bindingOrder - b.bindingOrder);
  return candidates[0]?.id ?? null;
}

function drawPick(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  stress: number,
) {
  const flex = stress * 6;
  ctx.save();
  ctx.strokeStyle = COLORS.pick;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W - 30, CYL_BOTTOM + 30);
  ctx.quadraticCurveTo(CANVAS_W / 2, CYL_BOTTOM + 40 + flex, x, y);
  ctx.stroke();
  ctx.fillStyle = stress > 0.6 ? COLORS.wrenchStress : COLORS.pick;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTensionWrench(ctx: CanvasRenderingContext2D, state: LockState) {
  const tensionRot = state.tension * 0.25;
  ctx.save();
  ctx.translate(160, CYL_BOTTOM + 8);
  ctx.rotate(tensionRot);
  ctx.fillStyle = state.tension > state.config.safeTensionMax
    ? COLORS.wrenchStress
    : COLORS.wrench;
  ctx.fillRect(-50, -6, 80, 8);
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.fillRect(-50, -2, 80, 2);
  ctx.restore();
}

function drawStressAndTension(ctx: CanvasRenderingContext2D, state: LockState) {
  const barW = 160;
  const barH = 8;
  const startX = 40;
  const y = CANVAS_H - 60;
  ctx.font = "10px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#6a6a76";
  ctx.fillText("TENSION", startX, y - 14);
  ctx.strokeStyle = "rgba(255,255,255,.15)";
  ctx.strokeRect(startX, y, barW, barH);
  const safeX1 = startX + state.config.safeTensionMin * barW;
  const safeX2 = startX + state.config.safeTensionMax * barW;
  ctx.fillStyle = "rgba(70,240,160,.18)";
  ctx.fillRect(safeX1, y, safeX2 - safeX1, barH);
  const tCol =
    state.tension > state.config.safeTensionMax
      ? "#ff5e7a"
      : state.tension < state.config.safeTensionMin
        ? "#ffcf5c"
        : "#22e0ff";
  ctx.fillStyle = tCol;
  ctx.fillRect(startX, y, state.tension * barW, barH);

  const stressX = startX + barW + 40;
  ctx.fillStyle = "#6a6a76";
  ctx.fillText("PICK STRESS", stressX, y - 14);
  ctx.strokeStyle = "rgba(255,255,255,.15)";
  ctx.strokeRect(stressX, y, barW, barH);
  ctx.fillStyle =
    state.pickStress > 0.7 ? "#ff5e7a" : state.pickStress > 0.35 ? "#ffcf5c" : "#46f0a0";
  ctx.fillRect(stressX, y, state.pickStress * barW, barH);

  const pickX = stressX + barW + 40;
  ctx.fillStyle = "#6a6a76";
  ctx.fillText("PICKS", pickX, y - 14);
  for (let i = 0; i < 3; i++) {
    const on = i < state.picksLeft;
    ctx.fillStyle = on ? "#ffcf5c" : "rgba(255,207,92,.15)";
    ctx.fillRect(pickX + i * 14, y, 8, barH);
  }
}

function drawHeightGuides(
  ctx: CanvasRenderingContext2D,
  state: LockState,
  pinXFor: (s: LockState, pos: number) => number,
) {
  for (const pin of state.pins) {
    if (pin.isSet) continue;
    const x = pinXFor(state, pin.id);
    const keyBottom = CYL_BOTTOM - 20;
    const y = keyBottom - pin.targetHeight * (keyBottom - SHEAR_Y);
    ctx.strokeStyle = "rgba(255,207,92,.35)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.lineTo(x + 20, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawSeed(
  ctx: CanvasRenderingContext2D,
  seed: number,
  difficulty: Difficulty,
) {
  ctx.font = "10px 'IBM Plex Mono', monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = COLORS.seed;
  ctx.fillText(
    `${difficulty.toUpperCase()} · seed ${seed.toString(16).padStart(8, "0")}`,
    CANVAS_W - 12,
    12,
  );
  ctx.textAlign = "left";
}

function TopBar({
  difficulty,
  seed,
  muted,
  reducedMotion,
  onDifficulty,
  onMute,
  onReducedMotion,
}: {
  difficulty: Difficulty;
  seed: number;
  muted: boolean;
  reducedMotion: boolean;
  onDifficulty: (d: Difficulty) => void;
  onMute: () => void;
  onReducedMotion: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 12,
        fontFamily: "var(--font-ibm-plex-mono), monospace",
        fontSize: 11,
        letterSpacing: ".14em",
        color: "#6a6a76",
      }}
    >
      <span>DIFFICULTY</span>
      {(["easy", "medium", "hard"] as const).map((d) => {
        const active = d === difficulty;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onDifficulty(d)}
            aria-pressed={active}
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: 11,
              letterSpacing: ".14em",
              padding: "5px 12px",
              color: active ? "#04121a" : "#c3c3ce",
              background: active ? "#22e0ff" : "transparent",
              border: `1px solid ${active ? "#22e0ff" : "rgba(255,255,255,.15)"}`,
              cursor: "pointer",
              fontWeight: active ? 700 : 500,
            }}
          >
            {d.toUpperCase()}
          </button>
        );
      })}
      <span style={{ marginLeft: "auto", color: "#4a4459" }}>
        SEED {seed.toString(16).padStart(8, "0")}
      </span>
      <button
        type="button"
        onClick={onMute}
        aria-label={muted ? "Unmute sound" : "Mute sound"}
        aria-pressed={muted}
        style={toggleBtn(muted)}
      >
        {muted ? "◇ MUTED" : "◆ SOUND"}
      </button>
      <button
        type="button"
        onClick={onReducedMotion}
        aria-label="Toggle reduced motion"
        aria-pressed={reducedMotion}
        style={toggleBtn(reducedMotion)}
      >
        {reducedMotion ? "◇ MOTION OFF" : "◆ MOTION"}
      </button>
    </div>
  );
}

function toggleBtn(pressed: boolean): React.CSSProperties {
  return {
    fontFamily: "var(--font-ibm-plex-mono), monospace",
    fontSize: 11,
    letterSpacing: ".14em",
    padding: "5px 10px",
    color: pressed ? "#6a6a76" : "#c3c3ce",
    background: "transparent",
    border: "1px solid rgba(255,255,255,.15)",
    cursor: "pointer",
  };
}

function StatusRow({
  elapsed,
  pinsSet,
  pinsTotal,
  picksLeft,
  oversets,
  best,
  score,
}: {
  elapsed: number;
  pinsSet: number;
  pinsTotal: number;
  picksLeft: number;
  oversets: number;
  best: number;
  score: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        alignItems: "stretch",
        marginBottom: 12,
      }}
    >
      <StatBox label="TIME" value={fmtTime(elapsed)} />
      <StatBox label="PINS" value={`${pinsSet}/${pinsTotal}`} />
      <StatBox label="PICKS" value={picksLeft.toString()} />
      <StatBox label="OVERSETS" value={oversets.toString()} />
      <StatBox label="SCORE" value={score.toString()} />
      <BestBox value={best} />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 80 }}>
      <div
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 11,
          letterSpacing: ".16em",
          color: "#6a6a76",
          marginBottom: 4,
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

function BestBox({ value }: { value: number }) {
  return (
    <div
      style={{
        marginLeft: "auto",
        padding: "6px 14px",
        border: "1px solid rgba(34,224,255,.4)",
        background: "rgba(34,224,255,.05)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 11,
          letterSpacing: ".2em",
          color: "#22e0ff",
          marginBottom: 4,
        }}
      >
        ◆ HI SCORE
      </div>
      <div
        style={{
          fontFamily: "var(--font-chakra-petch), sans-serif",
          fontWeight: 700,
          fontSize: 24,
          color: "#22e0ff",
          textShadow: "0 0 12px rgba(34,224,255,.5)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ResultOverlay({
  state,
  status,
  score,
  best,
  onRetry,
  onNewLock,
}: {
  state: LockState;
  status: "opened" | "failed";
  score: number;
  best: number;
  onRetry: () => void;
  onNewLock: () => void;
}) {
  const opened = status === "opened";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        background: "rgba(4,3,10,.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 12,
          letterSpacing: ".24em",
          color: opened ? "#46f0a0" : "#ff5e7a",
          marginBottom: 12,
        }}
      >
        {opened ? "▚ CYLINDER OPEN" : "▚ ALL PICKS BROKEN"}
      </div>
      <div
        style={{
          fontFamily: "var(--font-chakra-petch), sans-serif",
          fontWeight: 700,
          fontSize: "clamp(30px, 6vw, 46px)",
          color: "#fff",
          textShadow: opened
            ? "0 0 24px rgba(70,240,160,.5)"
            : "0 0 24px rgba(255,94,122,.5)",
        }}
      >
        {opened ? "SUCCESS" : "FAILED"}
      </div>
      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(120px, 1fr))",
          gap: 12,
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 12,
          color: "#c3c3ce",
        }}
      >
        <span>TIME: {fmtTime(state.elapsed)}</span>
        <span>OVERSETS: {state.oversetCount}</span>
        <span>PINS DROPPED: {state.droppedCount}</span>
        <span>PICKS BROKEN: {state.picksBrokenCount}</span>
      </div>
      {opened && (
        <div
          style={{
            marginTop: 18,
            fontFamily: "var(--font-chakra-petch), sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: "#22e0ff",
          }}
        >
          SCORE {score}
          {score >= best && score > 0 && (
            <span
              style={{
                marginLeft: 10,
                fontSize: 12,
                letterSpacing: ".2em",
                color: "#46f0a0",
              }}
            >
              ◆ NEW BEST
            </span>
          )}
        </div>
      )}
      <div
        style={{
          marginTop: 24,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button type="button" onClick={onRetry} style={actionBtn(false)}>
          ◆ RETRY SAME LOCK
        </button>
        <button type="button" onClick={onNewLock} style={actionBtn(true)}>
          ▶ NEW LOCK
        </button>
      </div>
    </div>
  );
}

function actionBtn(primary: boolean): React.CSSProperties {
  return {
    fontFamily: "var(--font-chakra-petch), sans-serif",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: ".14em",
    padding: "10px 20px",
    border: `1px solid ${primary ? "#22e0ff" : "rgba(255,255,255,.2)"}`,
    color: primary ? "#04121a" : "#c3c3ce",
    background: primary ? "#22e0ff" : "transparent",
    cursor: "pointer",
    boxShadow: primary ? "0 0 20px rgba(34,224,255,.4)" : "none",
  };
}

function ControlGuide() {
  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.35)",
        fontFamily: "var(--font-ibm-plex-mono), monospace",
        fontSize: 11,
        letterSpacing: ".14em",
        color: "#6a6a76",
        display: "flex",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <span>◆ MOUSE / A·D — move pick between pins</span>
      <span>◆ W·S / MOUSE Y — lift pin</span>
      <span>◆ SPACE — apply tension</span>
      <span>◆ TOUCH LEFT — pick · TOUCH RIGHT — tension</span>
    </div>
  );
}
