"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyMove,
  canMove,
  generatePuzzle,
  HEIGHT_MAX,
  HEIGHT_MIN,
  randomSeed,
  restart as restartPuzzle,
  undoLast,
  type Difficulty,
  type Puzzle,
} from "./logic";
import { ChainAudio } from "./audio";

const FONT_DISPLAY = "var(--font-chakra-petch), sans-serif";
const FONT_MONO = "var(--font-ibm-plex-mono), monospace";

function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

export default function ChainReaction() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [seed, setSeed] = useState<number>(() => randomSeed());
  const [puzzle, setPuzzle] = useState<Puzzle>(() =>
    generatePuzzle("easy", seed),
  );
  const [selected, setSelected] = useState<number>(0);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [invalidPin, setInvalidPin] = useState<number | null>(null);
  const [muted, setMuted] = useState<boolean>(false);
  const audioRef = useRef<ChainAudio | null>(null);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new ChainAudio();
    audioRef.current.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    if (!puzzle.startTime || puzzle.opened) return;
    const id = setInterval(() => setNowMs(Date.now()), 200);
    return () => clearInterval(id);
  }, [puzzle.startTime, puzzle.opened]);

  const startPuzzleFor = useCallback(
    (d: Difficulty, s: number) => {
      const p = generatePuzzle(d, s);
      setDifficulty(d);
      setSeed(s);
      setPuzzle(p);
      setSelected(0);
      setNowMs(Date.now());
    },
    [],
  );

  const tryMove = useCallback(
    (pinIdx: number, dir: 1 | -1) => {
      audioRef.current?.resume();
      setPuzzle((prev) => {
        if (prev.opened) return prev;
        if (!canMove(prev, pinIdx, dir)) {
          setInvalidPin(pinIdx);
          setTimeout(() => setInvalidPin(null), 260);
          audioRef.current?.invalid();
          return prev;
        }
        const next: Puzzle = {
          ...prev,
          heights: prev.heights.slice(),
          history: prev.history.slice(),
        };
        if (next.startTime === null) next.startTime = Date.now();
        const evt = applyMove(next, pinIdx, dir);
        audioRef.current?.move(0.85 + pinIdx * 0.06);
        for (const id of evt.crossedShearLine) {
          audioRef.current?.setPin(0.9 + id * 0.05);
        }
        for (const id of evt.leftShearLine) {
          audioRef.current?.unset(0.9 + id * 0.05);
        }
        if (next.opened) {
          setTimeout(() => audioRef.current?.opened(next.pinCount), 120);
          if (
            typeof navigator !== "undefined" &&
            typeof navigator.vibrate === "function"
          ) {
            navigator.vibrate([30, 50, 30, 50, 80]);
          }
        }
        return next;
      });
    },
    [],
  );

  const undo = () => {
    setPuzzle((prev) => {
      const next: Puzzle = {
        ...prev,
        heights: prev.heights.slice(),
        history: prev.history.slice(),
      };
      if (undoLast(next)) return next;
      return prev;
    });
  };

  const doRestart = () => {
    setPuzzle((prev) => {
      const next: Puzzle = {
        ...prev,
        heights: prev.heights.slice(),
        history: prev.history.slice(),
      };
      restartPuzzle(next);
      if (prev.history.length > 0 && next.history.length === 0) {
        const original = prev.history[0]!;
        next.heights = original.slice();
      }
      return next;
    });
  };

  const retry = () => startPuzzleFor(difficulty, seed);
  const newLock = () => startPuzzleFor(difficulty, randomSeed());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(
        e.code,
      )) {
        e.preventDefault();
      }
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        setSelected((s) => Math.max(0, s - 1));
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        setSelected((s) => Math.min(puzzle.pinCount - 1, s + 1));
      } else if (e.code === "ArrowUp" || e.code === "KeyW") {
        tryMove(selected, 1);
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        tryMove(selected, -1);
      } else if (e.code === "KeyZ" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        undo();
      } else if (e.code === "KeyR" && !e.metaKey && !e.ctrlKey) {
        doRestart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, puzzle.pinCount, tryMove]);

  const elapsed = puzzle.startTime ? nowMs - puzzle.startTime : 0;

  return (
    <div style={{ width: "100%" }}>
      <TopBar
        difficulty={difficulty}
        seed={seed}
        moves={puzzle.moveCount}
        time={elapsed}
        canUndo={puzzle.history.length > 0}
        muted={muted}
        onDifficulty={(d) => startPuzzleFor(d, randomSeed())}
        onUndo={undo}
        onRestart={doRestart}
        onRetry={retry}
        onNewLock={newLock}
        onMute={() => setMuted((m) => !m)}
      />
      <div
        style={{
          position: "relative",
          border: "1px solid rgba(255,45,156,.25)",
          boxShadow: "0 0 40px rgba(255,45,156,.12)",
          background: "linear-gradient(180deg,#0c0716,#0a0510)",
          padding: "clamp(20px, 3vw, 40px) clamp(12px, 3vw, 32px)",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            opacity: 0.28,
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,.5) 3px, rgba(0,0,0,0) 4px)",
          }}
        />
        <PuzzleView
          puzzle={puzzle}
          selected={selected}
          invalidPin={invalidPin}
          onSelect={setSelected}
          onMove={tryMove}
        />
        {puzzle.opened && (
          <OpenedOverlay
            time={elapsed}
            moves={puzzle.moveCount}
            onRetry={retry}
            onNewLock={newLock}
          />
        )}
      </div>
      <ControlHint />
    </div>
  );
}

function TopBar({
  difficulty,
  seed,
  moves,
  time,
  canUndo,
  muted,
  onDifficulty,
  onUndo,
  onRestart,
  onRetry,
  onNewLock,
  onMute,
}: {
  difficulty: Difficulty;
  seed: number;
  moves: number;
  time: number;
  canUndo: boolean;
  muted: boolean;
  onDifficulty: (d: Difficulty) => void;
  onUndo: () => void;
  onRestart: () => void;
  onRetry: () => void;
  onNewLock: () => void;
  onMute: () => void;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 10,
          fontFamily: FONT_MONO,
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
              style={{
                fontFamily: FONT_MONO,
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
          aria-pressed={muted}
          style={toggleBtn(muted)}
        >
          {muted ? "◇ MUTED" : "◆ SOUND"}
        </button>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "stretch",
          marginBottom: 12,
        }}
      >
        <StatBox label="MOVES" value={moves.toString()} />
        <StatBox label="TIME" value={fmtTime(time)} />
        <div style={{ flex: 1 }} />
        <ActionButton onClick={onUndo} disabled={!canUndo} label="↶ UNDO" />
        <ActionButton onClick={onRestart} label="↺ RESTART" />
        <ActionButton onClick={onRetry} label="◆ RETRY" />
        <ActionButton primary onClick={onNewLock} label="▶ NEW LOCK" />
      </div>
    </>
  );
}

function toggleBtn(pressed: boolean): React.CSSProperties {
  return {
    fontFamily: FONT_MONO,
    fontSize: 11,
    letterSpacing: ".14em",
    padding: "5px 10px",
    color: pressed ? "#6a6a76" : "#c3c3ce",
    background: "transparent",
    border: "1px solid rgba(255,255,255,.15)",
    cursor: "pointer",
  };
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 72 }}>
      <div
        style={{
          fontFamily: FONT_MONO,
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
          fontFamily: FONT_DISPLAY,
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

function ActionButton({
  label,
  onClick,
  primary,
  disabled,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: ".12em",
        padding: "8px 14px",
        border: `1px solid ${primary ? "#22e0ff" : "rgba(255,255,255,.15)"}`,
        color: disabled
          ? "rgba(255,255,255,.25)"
          : primary
            ? "#04121a"
            : "#c3c3ce",
        background: primary ? "#22e0ff" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: primary ? "0 0 16px rgba(34,224,255,.4)" : "none",
        opacity: disabled ? 0.5 : 1,
        alignSelf: "flex-end",
      }}
    >
      {label}
    </button>
  );
}

function PuzzleView({
  puzzle,
  selected,
  invalidPin,
  onSelect,
  onMove,
}: {
  puzzle: Puzzle;
  selected: number;
  invalidPin: number | null;
  onSelect: (i: number) => void;
  onMove: (i: number, dir: 1 | -1) => void;
}) {
  const selectedRule = puzzle.rules[selected];
  const previewMap = new Map<number, number>();
  if (selectedRule) {
    for (const offset of selectedRule.affects) {
      const target = selected + offset;
      if (target >= 0 && target < puzzle.pinCount) {
        previewMap.set(target, previewMap.get(target) ?? 0);
      }
    }
  }

  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        gap: "clamp(10px, 2.5vw, 22px)",
        justifyContent: "center",
        alignItems: "stretch",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      {puzzle.rules.map((rule, i) => (
        <PinColumn
          key={i}
          index={i}
          rule={rule}
          height={puzzle.heights[i]!}
          heightMin={puzzle.heightMin}
          heightMax={puzzle.heightMax}
          isSelected={i === selected}
          isPreviewed={previewMap.has(i) && i !== selected}
          isInvalid={i === invalidPin}
          showLinkage={puzzle.showLinkages}
          isDone={puzzle.opened}
          canMoveUp={canMove(puzzle, i, 1)}
          canMoveDown={canMove(puzzle, i, -1)}
          onSelect={() => onSelect(i)}
          onUp={() => {
            onSelect(i);
            onMove(i, 1);
          }}
          onDown={() => {
            onSelect(i);
            onMove(i, -1);
          }}
        />
      ))}
    </div>
  );
}

const CELL_H = 30;
const TUBE_HEIGHT = CELL_H * (HEIGHT_MAX - HEIGHT_MIN + 1);

function PinColumn({
  index,
  rule,
  height,
  heightMin,
  heightMax,
  isSelected,
  isPreviewed,
  isInvalid,
  showLinkage,
  isDone,
  canMoveUp,
  canMoveDown,
  onSelect,
  onUp,
  onDown,
}: {
  index: number;
  rule: { moveStep: number; affects: number[] };
  height: number;
  heightMin: number;
  heightMax: number;
  isSelected: boolean;
  isPreviewed: boolean;
  isInvalid: boolean;
  showLinkage: boolean;
  isDone: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: () => void;
  onUp: () => void;
  onDown: () => void;
}) {
  const atShear = height === 0;
  const range = heightMax - heightMin;
  const relativeFromTop = (heightMax - height) / range;
  const pinTop = relativeFromTop * (TUBE_HEIGHT - CELL_H);

  let borderColor = "rgba(255,255,255,.1)";
  let bgColor = "rgba(255,255,255,.02)";
  if (isSelected) {
    borderColor = "#ffcf5c";
    bgColor = "rgba(255,207,92,.06)";
  } else if (isPreviewed) {
    borderColor = "rgba(34,224,255,.5)";
    bgColor = "rgba(34,224,255,.05)";
  }
  if (isInvalid) {
    borderColor = "#ff5e7a";
  }
  if (isDone) {
    borderColor = "#46f0a0";
    bgColor = "rgba(70,240,160,.08)";
  }

  const pinColor = atShear ? "#46f0a0" : isSelected ? "#ffcf5c" : "#a58b6a";

  const shakeStyle: React.CSSProperties = isInvalid
    ? { animation: "gl-shake 0.26s ease-in-out" }
    : {};

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        flex: "1 1 60px",
        maxWidth: 96,
        minWidth: 56,
      }}
    >
      <button
        type="button"
        aria-label={`Raise pin ${index + 1}`}
        onClick={onUp}
        disabled={!canMoveUp || isDone}
        style={{
          appearance: "none",
          border: `1px solid ${canMoveUp && !isDone ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.08)"}`,
          background: canMoveUp && !isDone ? "rgba(255,255,255,.04)" : "transparent",
          color: canMoveUp && !isDone ? "#c3c3ce" : "rgba(255,255,255,.2)",
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 14,
          width: "100%",
          padding: "6px 0",
          cursor: canMoveUp && !isDone ? "pointer" : "not-allowed",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        ▲
      </button>

      <button
        type="button"
        onClick={onSelect}
        aria-label={`Select pin ${index + 1}`}
        style={{
          appearance: "none",
          position: "relative",
          width: "100%",
          height: TUBE_HEIGHT,
          padding: 0,
          border: `1px solid ${borderColor}`,
          background: bgColor,
          cursor: "pointer",
          transition: "border-color .18s, background .18s",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
          ...shakeStyle,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: -6,
            right: -6,
            top: TUBE_HEIGHT / 2 - 1,
            height: 2,
            background: atShear ? "#46f0a0" : "rgba(34,224,255,.55)",
            boxShadow: atShear
              ? "0 0 12px rgba(70,240,160,.7)"
              : "0 0 6px rgba(34,224,255,.35)",
            transition: "background .18s, box-shadow .18s",
          }}
        />

        <LinkageBadge rule={rule} highlight={isSelected} />
        {isSelected && showLinkage && <StandardLinkageDots rule={rule} />}

        <div
          style={{
            position: "absolute",
            left: 6,
            right: 6,
            top: pinTop + 3,
            height: CELL_H - 6,
            background: pinColor,
            boxShadow: atShear ? `0 0 14px ${pinColor}88` : "none",
            transition: "top .28s cubic-bezier(.4,1.8,.4,1), background .18s, box-shadow .18s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT_MONO,
            fontSize: 10,
            fontWeight: 600,
            color: atShear ? "#0a0410" : "rgba(0,0,0,.45)",
            letterSpacing: ".05em",
          }}
        >
          {height > 0 ? `+${height}` : height}
        </div>
      </button>

      <button
        type="button"
        aria-label={`Lower pin ${index + 1}`}
        onClick={onDown}
        disabled={!canMoveDown || isDone}
        style={{
          appearance: "none",
          border: `1px solid ${canMoveDown && !isDone ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.08)"}`,
          background: canMoveDown && !isDone ? "rgba(255,255,255,.04)" : "transparent",
          color: canMoveDown && !isDone ? "#c3c3ce" : "rgba(255,255,255,.2)",
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 14,
          width: "100%",
          padding: "6px 0",
          cursor: canMoveDown && !isDone ? "pointer" : "not-allowed",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        ▼
      </button>

      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: ".16em",
          color: isSelected
            ? "#ffcf5c"
            : atShear
              ? "#46f0a0"
              : "rgba(255,255,255,.4)",
        }}
      >
        {index + 1}
      </div>

      {isPreviewed && (
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: ".1em",
            color: "#22e0ff",
            marginTop: -2,
          }}
        >
          ↕ LINKED
        </div>
      )}
    </div>
  );
}

function LinkageBadge({
  rule,
  highlight,
}: {
  rule: { moveStep: number; affects: number[] };
  highlight: boolean;
}) {
  const badges: string[] = [];
  if (rule.moveStep > 1) badges.push(`×${rule.moveStep}`);
  const hasSkip = rule.affects.some((o) => Math.abs(o) === 2);
  if (hasSkip) badges.push("SKIP");
  const symmetric =
    rule.affects.includes(-1) && rule.affects.includes(1);
  const onlyLeft = rule.affects.length === 1 && rule.affects[0] === -1;
  const onlyRight = rule.affects.length === 1 && rule.affects[0] === 1;
  if (!symmetric && !hasSkip) {
    if (onlyLeft) badges.push("← ONLY");
    else if (onlyRight) badges.push("→ ONLY");
  }
  if (badges.length === 0) return null;
  const accent = highlight ? "#ffcf5c" : "rgba(255,207,92,.7)";
  const bg = highlight
    ? "rgba(255,207,92,.14)"
    : "rgba(255,207,92,.06)";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: -20,
        display: "flex",
        gap: 3,
        justifyContent: "center",
        pointerEvents: "none",
        flexWrap: "wrap",
      }}
    >
      {badges.map((b) => (
        <span
          key={b}
          style={{
            fontFamily: FONT_MONO,
            fontWeight: 600,
            fontSize: 9,
            letterSpacing: ".08em",
            padding: "2px 5px",
            color: accent,
            border: `1px solid ${accent}`,
            background: bg,
            whiteSpace: "nowrap",
          }}
        >
          {b}
        </span>
      ))}
    </div>
  );
}

function StandardLinkageDots({
  rule,
}: {
  rule: { moveStep: number; affects: number[] };
}) {
  const symmetric =
    rule.affects.includes(-1) && rule.affects.includes(1);
  const isSpecial =
    rule.moveStep > 1 ||
    rule.affects.some((o) => Math.abs(o) === 2) ||
    (!symmetric && rule.affects.length === 1);
  if (isSpecial) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: -14,
        fontFamily: FONT_MONO,
        fontSize: 9,
        letterSpacing: ".08em",
        color: "rgba(255,255,255,.35)",
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      ↔ ±1
    </div>
  );
}

function OpenedOverlay({
  time,
  moves,
  onRetry,
  onNewLock,
}: {
  time: number;
  moves: number;
  onRetry: () => void;
  onNewLock: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        background: "rgba(4,3,10,.88)",
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
          fontFamily: FONT_MONO,
          fontSize: 12,
          letterSpacing: ".24em",
          color: "#46f0a0",
          marginBottom: 12,
        }}
      >
        ▚ CHAIN ALIGNED
      </div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: "clamp(32px, 6vw, 52px)",
          color: "#fff",
          textShadow: "0 0 24px rgba(70,240,160,.5)",
        }}
      >
        UNLOCKED
      </div>
      <div
        style={{
          marginTop: 16,
          fontFamily: FONT_MONO,
          fontSize: 13,
          color: "#c3c3ce",
          display: "flex",
          gap: 20,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <span>TIME · {fmtTime(time)}</span>
        <span>MOVES · {moves}</span>
      </div>
      <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={onRetry}
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: ".12em",
            padding: "10px 22px",
            border: "1px solid rgba(255,255,255,.2)",
            background: "transparent",
            color: "#c3c3ce",
            cursor: "pointer",
          }}
        >
          ◆ RETRY LOCK
        </button>
        <button
          type="button"
          onClick={onNewLock}
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: ".12em",
            padding: "10px 22px",
            border: "1px solid #22e0ff",
            background: "#22e0ff",
            color: "#04121a",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(34,224,255,.4)",
          }}
        >
          ▶ NEW LOCK
        </button>
      </div>
    </div>
  );
}

function ControlHint() {
  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 14px",
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(0,0,0,.35)",
        fontFamily: FONT_MONO,
        fontSize: 11,
        letterSpacing: ".14em",
        color: "#6a6a76",
        display: "flex",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <span>◆ TAP ▲ / ▼ TO MOVE A PIN</span>
      <span>◆ ARROW KEYS / WASD ON DESKTOP</span>
      <span>◆ RAISE ONE → NEIGHBORS DROP</span>
      <span>◆ ALIGN ALL AT SHEAR LINE (0)</span>
    </div>
  );
}
