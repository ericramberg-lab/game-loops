"use client";

import { useState } from "react";
import { mechanics, type Platform } from "@/lib/mechanics";
import MechanicCard from "./MechanicCard";

const FONT_MONO = "var(--font-ibm-plex-mono), monospace";
const PLATFORMS: Platform[] = ["Mobile", "Desktop", "Gamepad"];

const PLATFORM_ICON: Record<Platform, string> = {
  Mobile: "▮",
  Desktop: "▤",
  Gamepad: "◈",
};

export default function MechanicGrid() {
  const [active, setActive] = useState<Set<Platform>>(new Set());

  const toggle = (p: Platform) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const clear = () => setActive(new Set());

  const visible = mechanics.filter((m) =>
    Array.from(active).every((p) => m.platforms.includes(p)),
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            letterSpacing: ".2em",
            color: "#6a6a76",
          }}
        >
          FILTER BY PLATFORM
        </span>
        {PLATFORMS.map((p) => {
          const on = active.has(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                letterSpacing: ".1em",
                color: on ? "#04121a" : "#ffcf5c",
                background: on ? "#ffcf5c" : "transparent",
                border: `1px solid ${on ? "#ffcf5c" : "rgba(255,207,92,.4)"}`,
                padding: "5px 12px",
                cursor: "pointer",
                fontWeight: on ? 700 : 500,
                boxShadow: on ? "0 0 14px rgba(255,207,92,.4)" : "none",
                transition:
                  "background .15s, color .15s, box-shadow .15s, border-color .15s",
              }}
            >
              {PLATFORM_ICON[p]} {p.toUpperCase()}
            </button>
          );
        })}
        {active.size > 0 && (
          <button
            type="button"
            onClick={clear}
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              letterSpacing: ".1em",
              color: "#9a9aa6",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              padding: "5px 4px",
              marginLeft: 4,
            }}
          >
            ✕ CLEAR
          </button>
        )}
        <span
          style={{
            marginLeft: "auto",
            fontFamily: FONT_MONO,
            fontSize: 11,
            color: "#6a6a76",
          }}
        >
          {visible.length} / {mechanics.length}
        </span>
      </div>

      {visible.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 18,
          }}
        >
          {visible.map((m) => (
            <MechanicCard key={m.slug} m={m} />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            border: "1px dashed rgba(255,255,255,.1)",
            color: "#8a8a95",
            fontFamily: FONT_MONO,
            fontSize: 13,
            letterSpacing: ".1em",
          }}
        >
          NO MECHANICS MATCH THAT COMBINATION.
        </div>
      )}
    </>
  );
}
