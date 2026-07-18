"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = {
  red: "#ff5e7a",
  blue: "#22e0ff",
  green: "#46f0a0",
  yellow: "#ffcf5c",
  pink: "#ff2d9c",
} as const;

type Color = keyof typeof COLORS;
const COLOR_ORDER: Color[] = ["red", "blue", "green", "yellow", "pink"];

type Wire = { id: number; color: Color; cut: boolean };
type Command = { text: string; hasExecute: boolean; targets: Set<number> };
type Status = "idle" | "playing" | "reveal" | "over";
type Result = "perfect" | "fail";

type GameState = {
  status: Status;
  score: number;
  best: number;
  round: number;
  lives: number;
  wires: Wire[];
  command: Command;
  timeLeft: number;
  maxTime: number;
  result: Result | null;
  revealAt: number;
};

const START_LIVES = 3;

function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickTwo<T>(arr: readonly T[]): [T, T] {
  const a = arr[Math.floor(Math.random() * arr.length)]!;
  let b = arr[Math.floor(Math.random() * arr.length)]!;
  let tries = 0;
  while (b === a && tries < 20) {
    b = arr[Math.floor(Math.random() * arr.length)]!;
    tries++;
  }
  return [a, b];
}

function wireCountFor(round: number): number {
  return Math.min(6, 3 + Math.floor((round - 1) / 3));
}

function colorPoolFor(round: number): Color[] {
  const n = Math.min(5, 3 + Math.floor((round - 1) / 5));
  return COLOR_ORDER.slice(0, n);
}

function roundTime(round: number): number {
  return Math.max(1.6, 5.5 - (round - 1) * 0.32);
}

function revealTime(round: number): number {
  return Math.max(0.7, 1.2 - (round - 1) * 0.03);
}

function makeWires(round: number, startId: number): Wire[] {
  const count = wireCountFor(round);
  const pool = colorPoolFor(round);
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    color: pickOne(pool),
    cut: false,
  }));
}

type Template =
  | { kind: "color"; c: Color }
  | { kind: "all" }
  | { kind: "except"; c: Color }
  | { kind: "multi"; a: Color; b: Color }
  | { kind: "nothing" };

function pickTemplate(round: number, colorsPresent: Color[]): Template {
  const opts: Template[] = [{ kind: "color", c: pickOne(colorsPresent) }];
  if (round >= 3) opts.push({ kind: "all" });
  if (round >= 4 && colorsPresent.length >= 2) {
    opts.push({ kind: "except", c: pickOne(colorsPresent) });
  }
  if (round >= 6 && colorsPresent.length >= 2) {
    const [a, b] = pickTwo(colorsPresent);
    opts.push({ kind: "multi", a, b });
  }
  if (round >= 2) opts.push({ kind: "nothing" });
  return pickOne(opts);
}

function templateToText(t: Template): string {
  const upper = (c: Color) => c.toUpperCase();
  switch (t.kind) {
    case "color":
      return pickOne([
        `cut ${upper(t.c)}`,
        `cut the ${upper(t.c)} wire`,
        `cut all ${upper(t.c)} wires`,
      ]);
    case "all":
      return pickOne(["cut all wires", "cut everything"]);
    case "except":
      return pickOne([
        `cut all except ${upper(t.c)}`,
        `cut all non-${upper(t.c)} wires`,
        `cut everything but ${upper(t.c)}`,
      ]);
    case "multi":
      return `cut ${upper(t.a)} and ${upper(t.b)}`;
    case "nothing":
      return pickOne(["cut nothing", "hold", "hands off", "don't cut anything"]);
  }
}

function targetIdsFor(t: Template, wires: Wire[]): Set<number> {
  switch (t.kind) {
    case "color":
      return new Set(wires.filter((w) => w.color === t.c).map((w) => w.id));
    case "all":
      return new Set(wires.map((w) => w.id));
    case "except":
      return new Set(wires.filter((w) => w.color !== t.c).map((w) => w.id));
    case "multi":
      return new Set(
        wires.filter((w) => w.color === t.a || w.color === t.b).map((w) => w.id),
      );
    case "nothing":
      return new Set();
  }
}

function makeCommand(round: number, wires: Wire[]): Command {
  const colorsPresent = Array.from(new Set(wires.map((w) => w.color)));
  let template = pickTemplate(round, colorsPresent);
  const wantsExecute = Math.random() < 0.6;
  if (!wantsExecute && template.kind === "nothing") {
    template = { kind: "color", c: pickOne(colorsPresent) };
  }
  const text = templateToText(template);
  const targets = wantsExecute ? targetIdsFor(template, wires) : new Set<number>();
  return {
    text: wantsExecute ? `EXECUTE ${text}` : text,
    hasExecute: wantsExecute,
    targets,
  };
}

function startRound(prev: GameState, nextRound: number): GameState {
  const startId = (prev.wires.at(-1)?.id ?? 0) + 1;
  const wires = makeWires(nextRound, startId);
  const command = makeCommand(nextRound, wires);
  const maxTime = roundTime(nextRound);
  return {
    ...prev,
    status: "playing",
    round: nextRound,
    wires,
    command,
    timeLeft: maxTime,
    maxTime,
    result: null,
    revealAt: 0,
  };
}

function evaluate(wires: Wire[], targets: Set<number>): Result {
  for (const w of wires) {
    if (w.cut && !targets.has(w.id)) return "fail";
    if (!w.cut && targets.has(w.id)) return "fail";
  }
  return "perfect";
}

function freshState(best: number): GameState {
  return {
    status: "idle",
    score: 0,
    best,
    round: 0,
    lives: START_LIVES,
    wires: [],
    command: { text: "", hasExecute: false, targets: new Set() },
    timeLeft: 0,
    maxTime: 1,
    result: null,
    revealAt: 0,
  };
}

export default function Execute() {
  const [state, setState] = useState<GameState>(() => freshState(0));
  const bestRef = useRef(0);

  useEffect(() => {
    bestRef.current = state.best;
  }, [state.best]);

  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.status === "playing") {
          const nextTime = prev.timeLeft - 0.05;
          if (nextTime <= 0) {
            const result = evaluate(prev.wires, prev.command.targets);
            const scoreBonus = result === "perfect" ? prev.round * 30 : 0;
            const newLives = result === "perfect" ? prev.lives : prev.lives - 1;
            return {
              ...prev,
              status: "reveal",
              timeLeft: 0,
              result,
              revealAt: Date.now() + revealTime(prev.round) * 1000,
              score: prev.score + scoreBonus,
              lives: newLives,
            };
          }
          return { ...prev, timeLeft: nextTime };
        }
        if (prev.status === "reveal" && Date.now() >= prev.revealAt) {
          if (prev.lives <= 0) {
            const newBest = Math.max(prev.best, prev.score);
            bestRef.current = newBest;
            return { ...prev, status: "over", best: newBest };
          }
          return startRound(prev, prev.round + 1);
        }
        return prev;
      });
    }, 50);
    return () => clearInterval(id);
  }, []);

  const start = () => {
    setState(() => startRound(freshState(bestRef.current), 1));
  };

  const cut = (id: number) => {
    setState((prev) => {
      if (prev.status !== "playing") return prev;
      if (prev.wires.find((w) => w.id === id)?.cut) return prev;
      return {
        ...prev,
        wires: prev.wires.map((w) => (w.id === id ? { ...w, cut: true } : w)),
      };
    });
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <StatsRow
        lives={state.lives}
        score={state.score}
        round={state.round}
        best={state.best}
      />
      <div
        style={{
          position: "relative",
          border: "1px solid rgba(255,45,156,.25)",
          boxShadow: "0 0 40px rgba(255,45,156,.12)",
          background: "linear-gradient(180deg,#0c0716,#0a0510)",
          padding: "36px 32px 40px",
          overflow: "hidden",
        }}
      >
        <CommandDisplay state={state} />
        <TimerBar state={state} />
        <WireRow state={state} onCut={cut} />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            opacity: 0.28,
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,.5) 3px, rgba(0,0,0,0) 4px)",
          }}
        />
        {(state.status === "idle" || state.status === "over") && (
          <div
            onClick={start}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(4,3,10,.85)",
              padding: 24,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            {state.status === "idle" ? <IdleScreen /> : <OverScreen state={state} />}
          </div>
        )}
      </div>
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
        <span>
          ONLY <span style={{ color: "#46f0a0" }}>EXECUTE</span>-PREFIXED
          COMMANDS COUNT
        </span>
        <span>◆ CLICK / TAP A WIRE TO CUT IT</span>
        <span>◆ WAIT FOR THE TIMER TO EVALUATE</span>
      </div>
    </div>
  );
}

function StatsRow({
  lives,
  score,
  round,
  best,
}: {
  lives: number;
  score: number;
  round: number;
  best: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        justifyContent: "space-between",
        alignItems: "stretch",
        marginBottom: 12,
      }}
    >
      <Lives lives={lives} />
      <StatBlock label="ROUND" value={round.toString()} />
      <StatBlock label="SCORE" value={score.toString()} />
      <BestBlock value={best} />
    </div>
  );
}

function Lives({ lives }: { lives: number }) {
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <div
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 11,
          letterSpacing: ".16em",
          color: "#6a6a76",
          marginBottom: 6,
        }}
      >
        LIVES
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {Array.from({ length: START_LIVES }).map((_, i) => {
          const on = i < lives;
          return (
            <span
              key={i}
              style={{
                width: 26,
                height: 26,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${on ? "#ff2d9c" : "rgba(255,45,156,.2)"}`,
                color: on ? "#ff2d9c" : "rgba(255,45,156,.25)",
                background: on ? "rgba(255,45,156,.12)" : "transparent",
                boxShadow: on ? "0 0 12px rgba(255,45,156,.55)" : "none",
                fontFamily: "var(--font-chakra-petch), sans-serif",
                fontSize: 16,
                transform: "skewX(-8deg)",
                transition: "all .2s",
              }}
            >
              ◆
            </span>
          );
        })}
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
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
          fontSize: 22,
          color: "#fff",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function BestBlock({ value }: { value: number }) {
  return (
    <div
      style={{
        minWidth: 130,
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
          fontSize: 26,
          color: "#22e0ff",
          textShadow: "0 0 14px rgba(34,224,255,.55)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CommandDisplay({ state }: { state: GameState }) {
  const { command, status, result } = state;
  if (status === "idle" || status === "over") {
    return <div style={{ minHeight: 92 }} />;
  }

  if (status === "reveal") {
    const perfect = result === "perfect";
    return (
      <div
        style={{
          minHeight: 92,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-chakra-petch), sans-serif",
          fontWeight: 700,
          fontSize: 44,
          letterSpacing: ".08em",
          color: perfect ? "#46f0a0" : "#ff5e7a",
          textShadow: perfect
            ? "0 0 24px rgba(70,240,160,.7)"
            : "0 0 24px rgba(255,94,122,.7)",
        }}
      >
        {perfect ? "✓ PERFECT" : "✗ FAIL"}
      </div>
    );
  }

  const parts = command.hasExecute ? command.text.split(" ") : [];
  return (
    <div
      style={{
        minHeight: 92,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-ibm-plex-mono), monospace",
        fontWeight: 500,
        fontSize: 38,
        letterSpacing: ".02em",
        color: "#f5f5fa",
        textAlign: "center",
      }}
    >
      {command.hasExecute ? (
        <>
          <span
            style={{
              color: "#46f0a0",
              textShadow: "0 0 12px rgba(70,240,160,.6)",
              marginRight: "0.4em",
            }}
          >
            {parts[0]}
          </span>
          <span>{parts.slice(1).join(" ")}</span>
        </>
      ) : (
        command.text
      )}
    </div>
  );
}

function TimerBar({ state }: { state: GameState }) {
  const pct =
    state.status === "playing" && state.maxTime > 0
      ? Math.max(0, state.timeLeft / state.maxTime)
      : state.status === "reveal"
        ? 0
        : 1;
  const critical = pct < 0.3 && state.status === "playing";
  return (
    <div
      style={{
        margin: "16px auto 28px",
        maxWidth: 640,
        height: 6,
        background: "rgba(255,255,255,.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: `${pct * 100}%`,
          background: critical ? "#ff5e7a" : "#22e0ff",
          boxShadow: `0 0 12px ${critical ? "#ff5e7a" : "#22e0ff"}`,
          transition: state.status === "playing" ? "none" : "width .2s",
        }}
      />
    </div>
  );
}

function WireRow({
  state,
  onCut,
}: {
  state: GameState;
  onCut: (id: number) => void;
}) {
  if (state.wires.length === 0) {
    return <div style={{ minHeight: 200 }} />;
  }
  const interactive = state.status === "playing";
  const reveal = state.status === "reveal";
  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        justifyContent: "center",
        alignItems: "stretch",
        minHeight: 200,
        padding: "8px 0",
      }}
    >
      {state.wires.map((w) => (
        <WireButton
          key={w.id}
          wire={w}
          shouldCut={reveal && state.command.targets.has(w.id)}
          shouldNotCut={reveal && !state.command.targets.has(w.id)}
          interactive={interactive}
          onCut={() => onCut(w.id)}
        />
      ))}
    </div>
  );
}

function WireButton({
  wire,
  shouldCut,
  shouldNotCut,
  interactive,
  onCut,
}: {
  wire: Wire;
  shouldCut: boolean;
  shouldNotCut: boolean;
  interactive: boolean;
  onCut: () => void;
}) {
  const color = COLORS[wire.color];
  const correct = wire.cut ? shouldCut : shouldNotCut;
  const wrong = wire.cut ? shouldNotCut : shouldCut;
  const showOutcome = shouldCut || shouldNotCut;

  return (
    <button
      type="button"
      onClick={interactive ? onCut : undefined}
      disabled={!interactive || wire.cut}
      style={{
        appearance: "none",
        position: "relative",
        width: 110,
        border: `1px solid ${showOutcome ? (correct ? "#46f0a0" : wrong ? "#ff5e7a" : "rgba(255,255,255,.1)") : "rgba(255,255,255,.1)"}`,
        background: "transparent",
        cursor: interactive && !wire.cut ? "pointer" : "default",
        padding: "12px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        boxShadow: showOutcome
          ? correct
            ? "0 0 24px rgba(70,240,160,.35)"
            : wrong
              ? "0 0 24px rgba(255,94,122,.4)"
              : "none"
          : "none",
        transition: "border-color .2s, box-shadow .2s",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 10,
          letterSpacing: ".18em",
          color,
        }}
      >
        {wire.color.toUpperCase()}
      </span>
      <div
        style={{
          position: "relative",
          width: 12,
          flex: 1,
          minHeight: 150,
          background: wire.cut ? "rgba(255,255,255,.06)" : color,
          boxShadow: wire.cut ? "none" : `0 0 18px ${color}88`,
          transition: "background .2s",
        }}
      >
        {wire.cut && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "-8px",
              right: "-8px",
              height: 4,
              transform: "translateY(-50%) rotate(20deg)",
              background: "rgba(255,94,122,.6)",
              boxShadow: "0 0 10px rgba(255,94,122,.4)",
            }}
          />
        )}
      </div>
      <span
        style={{
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 11,
          letterSpacing: ".16em",
          color: wire.cut ? "#ff5e7a" : "rgba(255,255,255,.55)",
        }}
      >
        {wire.cut ? "CUT" : "◇"}
      </span>
    </button>
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
        ▚ STANDBY
      </div>
      <div
        style={{
          fontFamily: "var(--font-chakra-petch), sans-serif",
          fontWeight: 700,
          fontSize: 46,
          color: "#fff",
          letterSpacing: "-.01em",
          textShadow: "0 0 30px rgba(255,45,156,.4)",
        }}
      >
        CLICK TO <span style={{ color: "#22e0ff" }}>ARM</span>
      </div>
      <div
        style={{
          marginTop: 18,
          maxWidth: 520,
          color: "#b7b7c4",
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        Follow the command only if it starts with{" "}
        <span
          style={{
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            color: "#46f0a0",
          }}
        >
          EXECUTE
        </span>
        . Anything else is a decoy — leave every wire alone. Three lives.
      </div>
    </>
  );
}

function OverScreen({ state }: { state: GameState }) {
  const beatBest = state.score >= state.best && state.score > 0;
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
        ▚ TERMINATED
      </div>
      <div
        style={{
          fontFamily: "var(--font-chakra-petch), sans-serif",
          fontWeight: 700,
          fontSize: 44,
          color: "#fff",
        }}
      >
        SCORE <span style={{ color: "#22e0ff" }}>{state.score}</span>
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 12,
          color: "#8a8a95",
          letterSpacing: ".1em",
        }}
      >
        {state.round - (state.result === "fail" ? 1 : 0)} ROUNDS SURVIVED
      </div>
      {beatBest && (
        <div
          style={{
            marginTop: 8,
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
          marginTop: 22,
          fontFamily: "var(--font-chakra-petch), sans-serif",
          fontWeight: 700,
          fontSize: 22,
          color: "#fff",
        }}
      >
        CLICK TO <span style={{ color: "#22e0ff" }}>RETRY</span>
      </div>
    </>
  );
}
