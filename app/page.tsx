import LockpickDemo from "./_components/LockpickDemo";
import MechanicGrid from "./_components/MechanicGrid";
import { chips } from "@/lib/mechanics";

const FONT_DISPLAY = "var(--font-chakra-petch), sans-serif";
const FONT_MONO = "var(--font-ibm-plex-mono), monospace";

const marqueeItems = [
  { text: "◆ NEW · SAFE-CRACKING v2", color: "#9a9aa6" },
  { text: "◆ 42 MECHANICS LIVE", color: "#ff2d9c" },
  { text: "◆ UNITY · GODOT · UNREAL · WEB", color: "#9a9aa6" },
  { text: "◆ PLAY BEFORE YOU BUY", color: "#22e0ff" },
];

export default function Home() {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#07060d",
        minHeight: "100vh",
        fontFamily: "var(--font-space-grotesk), sans-serif",
      }}
      className="flex-1"
    >
      {/* perspective grid floor */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "-25%",
          right: "-25%",
          bottom: -160,
          height: 640,
          backgroundImage:
            "linear-gradient(rgba(34,224,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,156,.18) 1px, transparent 1px)",
          backgroundSize: "66px 66px",
          transform: "perspective(560px) rotateX(68deg)",
          transformOrigin: "bottom",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />

      {/* radial glows */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 70% at 80% -12%, rgba(255,45,156,.24), transparent 55%), radial-gradient(90% 60% at 4% -6%, rgba(34,224,255,.16), transparent 55%)",
          pointerEvents: "none",
        }}
      />

      {/* scanlines */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 40,
          pointerEvents: "none",
          opacity: 0.35,
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,.5) 3px, rgba(0,0,0,0) 4px)",
        }}
      />

      {/* top accent line */}
      <div
        style={{
          position: "relative",
          height: 3,
          background: "linear-gradient(90deg,#ff2d9c,#22e0ff)",
        }}
      />

      {/* marquee */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          background: "rgba(0,0,0,.45)",
        }}
      >
        <div
          className="gl-anim-marquee"
          style={{
            display: "flex",
            width: "200%",
            whiteSpace: "nowrap",
            fontFamily: FONT_MONO,
            fontSize: 12,
            letterSpacing: ".2em",
            padding: "9px 0",
          }}
        >
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} style={{ padding: "0 22px", color: item.color }}>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* nav */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 48px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: "2px solid #ff2d9c",
              boxShadow: "0 0 16px rgba(255,45,156,.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              color: "#ff2d9c",
              transform: "skewX(-6deg)",
            }}
          >
            GL
          </div>
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              letterSpacing: ".14em",
              fontSize: 20,
              color: "#fff",
            }}
          >
            GAME <span style={{ color: "#22e0ff" }}>LOOPS</span>
          </span>
        </div>
        <nav
          style={{
            display: "flex",
            gap: 32,
            fontFamily: FONT_MONO,
            fontSize: 13,
            letterSpacing: ".06em",
          }}
        >
          {[
            { label: "Browse", href: "#" },
            { label: "Engines", href: "#" },
            { label: "Pricing", href: "/pricing" },
            { label: "Contact", href: "/contact" },
          ].map((l) => (
            <a key={l.label} href={l.href} className="gl-nav-link">
              {l.label}
            </a>
          ))}
        </nav>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <a
            href="#"
            className="gl-nav-link"
            style={{ fontFamily: FONT_MONO, fontSize: 13 }}
          >
            Sign in
          </a>
          <a
            href="/pricing"
            className="gl-btn-magenta"
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: ".1em",
              padding: "10px 18px",
              background: "#ff2d9c",
              color: "#0a0410",
              boxShadow: "0 0 20px rgba(255,45,156,.5)",
            }}
          >
            INSERT COIN
          </a>
        </div>
      </div>

      {/* hero */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 480px",
          gap: 48,
          padding: "52px 48px 64px",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 13,
              letterSpacing: ".24em",
              color: "#22e0ff",
              marginBottom: 20,
            }}
          >
            ▚ DROP-IN GAMEPLAY LOOPS
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 72,
              lineHeight: 1.0,
              letterSpacing: "-.01em",
              color: "#fff",
              textShadow: "0 0 44px rgba(255,45,156,.32)",
              textWrap: "balance",
            }}
          >
            STEAL A<br />
            <span style={{ color: "#ff2d9c" }}>MECHANIC.</span>
            <br />
            SHIP IT <span style={{ color: "#22e0ff" }}>TODAY.</span>
          </h1>
          <p
            style={{
              maxWidth: 450,
              margin: "24px 0 32px",
              fontSize: 17,
              lineHeight: 1.6,
              color: "#b7b7c4",
              textWrap: "pretty",
            }}
          >
            A neon-lit library of the little games <em>inside</em> games —
            lockpicking, safe-cracking, hacking, fishing. Play each loop right
            here, then buy the source and drop it into Unity, Godot or Unreal.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              maxWidth: 470,
              border: "1px solid rgba(34,224,255,.4)",
              background: "rgba(0,0,0,.5)",
              boxShadow: "0 0 24px rgba(34,224,255,.15) inset",
            }}
          >
            <span
              style={{
                padding: "0 16px",
                color: "#22e0ff",
                fontFamily: FONT_MONO,
                fontSize: 16,
              }}
            >
              ›
            </span>
            <input
              placeholder="Search mechanics… try 'lockpick'"
              style={{
                flex: 1,
                background: "transparent",
                border: 0,
                outline: "none",
                color: "#fff",
                padding: "16px 0",
                fontFamily: FONT_MONO,
                fontSize: 14,
              }}
            />
            <button
              style={{
                border: 0,
                background: "#22e0ff",
                color: "#04121a",
                padding: "16px 24px",
                fontFamily: FONT_DISPLAY,
                fontWeight: 600,
                letterSpacing: ".1em",
                cursor: "pointer",
              }}
            >
              GO
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            {chips.map((c) => (
              <span
                key={c}
                className="gl-chip"
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  letterSpacing: ".06em",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <LockpickDemo />
      </div>

      {/* featured grid */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1280,
          margin: "0 auto",
          padding: "20px 48px 60px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 24,
            borderBottom: "1px solid rgba(255,255,255,.1)",
            paddingBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT_MONO,
                fontSize: 12,
                letterSpacing: ".2em",
                color: "#22e0ff",
                marginBottom: 8,
              }}
            >
              ▚ TOP OF THE LEADERBOARD
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: FONT_DISPLAY,
                fontWeight: 700,
                fontSize: 30,
                letterSpacing: ".03em",
                color: "#fff",
              }}
            >
              FEATURED LOOPS
            </h2>
          </div>
          <a
            href="#"
            style={{
              fontFamily: FONT_MONO,
              fontSize: 13,
              color: "#22e0ff",
            }}
          >
            VIEW ALL 42 →
          </a>
        </div>

        <MechanicGrid />
      </div>

      {/* footer */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1280,
          margin: "0 auto",
          padding: "26px 48px",
          borderTop: "1px solid rgba(255,255,255,.08)",
          display: "flex",
          justifyContent: "space-between",
          fontFamily: FONT_MONO,
          fontSize: 12,
          color: "#6a6a76",
        }}
      >
        <span>© 2026 GAME LOOPS · PRESS START</span>
        <span style={{ color: "#ff2d9c" }}>
          <span className="gl-anim-pulse-slow">◆</span> ONLINE
        </span>
      </div>
    </div>
  );
}
