import { type Mechanic, type Platform, difficultyStyle } from "@/lib/mechanics";

const FONT_DISPLAY = "var(--font-chakra-petch), sans-serif";
const FONT_MONO = "var(--font-ibm-plex-mono), monospace";

const PLATFORM_ICON: Record<Platform, string> = {
  Mobile: "▮",
  Desktop: "▤",
  Gamepad: "◈",
};

export default function MechanicCard({ m }: { m: Mechanic }) {
  const d = difficultyStyle[m.diff];
  return (
    <div
      className="gl-card"
      style={{
        position: "relative",
        background: "#0b0714",
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      {m.badge && (
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 3,
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: ".14em",
            background: "#22e0ff",
            color: "#04121a",
            padding: "4px 9px",
            boxShadow: "0 0 14px rgba(34,224,255,.6)",
          }}
        >
          {m.badge}
        </span>
      )}
      <div
        style={{
          position: "relative",
          height: 124,
          backgroundImage:
            "repeating-linear-gradient(45deg,#130d1f,#130d1f 11px,#0e0918 11px,#0e0918 22px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            letterSpacing: ".1em",
            color: "#54546a",
          }}
        >
          {m.preview}
        </span>
        <div
          className="gl-card-overlay"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(7,6,13,.4)",
          }}
        >
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              letterSpacing: ".14em",
              color: "#22e0ff",
              textShadow: "0 0 14px rgba(34,224,255,.8)",
            }}
          >
            ▶ PLAY DEMO
          </span>
        </div>
      </div>
      <div style={{ padding: "16px 16px 18px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 600,
              fontSize: 17,
              color: "#fff",
            }}
          >
            {m.name}
          </span>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontWeight: 600,
              fontSize: 15,
              color: "#ff2d9c",
            }}
          >
            {m.price}
          </span>
        </div>
        <p
          style={{
            margin: "8px 0 12px",
            fontSize: 13,
            lineHeight: 1.45,
            color: "#9a9aa6",
            minHeight: 36,
          }}
        >
          {m.blurb}
        </p>
        <div
          style={{
            display: "flex",
            gap: 5,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          {m.tags.map((t) => (
            <span
              key={t}
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                letterSpacing: ".06em",
                color: "#22e0ff",
                border: "1px solid rgba(34,224,255,.35)",
                padding: "2px 7px",
              }}
            >
              #{t}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: 5,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          {m.platforms.map((p) => (
            <span
              key={p}
              style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                letterSpacing: ".08em",
                color: "#ffcf5c",
                border: "1px solid rgba(255,207,92,.35)",
                padding: "2px 8px",
              }}
            >
              {PLATFORM_ICON[p]} {p.toUpperCase()}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {m.engines.map((e) => (
              <span
                key={e}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  color: "#b9b9c4",
                  border: "1px solid rgba(255,255,255,.14)",
                  padding: "3px 8px",
                }}
              >
                {e}
              </span>
            ))}
          </div>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 9px",
              background: d.bg,
              color: d.color,
            }}
          >
            {m.diff}
          </span>
        </div>
      </div>
    </div>
  );
}
