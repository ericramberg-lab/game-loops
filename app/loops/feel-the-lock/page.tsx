import FeelTheLock from "./FeelTheLock";

export const metadata = {
  title: "Feel the Lock · Game Loops",
};

export default function Page() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "clamp(14px, 3vw, 24px) clamp(12px, 3vw, 24px) 48px",
      }}
    >
      <div style={{ width: 900, maxWidth: "100%" }}>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: "var(--font-ibm-plex-mono), monospace",
              fontSize: 12,
              letterSpacing: ".24em",
              color: "#22e0ff",
              marginBottom: 8,
            }}
          >
            ▚ LOOP // 003
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-chakra-petch), sans-serif",
              fontWeight: 700,
              fontSize: "clamp(30px, 6vw, 44px)",
              letterSpacing: "-.01em",
              color: "#fff",
              textShadow: "0 0 30px rgba(255,45,156,.28)",
            }}
          >
            FEEL THE <span style={{ color: "#ff2d9c" }}>LOCK.</span>
          </h1>
          <p
            style={{
              maxWidth: 640,
              margin: "12px 0 12px",
              color: "#b7b7c4",
              fontSize: "clamp(13px, 2.4vw, 15px)",
              lineHeight: 1.55,
            }}
          >
            Two hands, one cylinder. Move the pick between pins, apply tension
            with <span style={{ color: "#22e0ff" }}>SPACE</span>, and lift the
            binding pin until it clicks. Too much tension jams the pick — too
            little and set pins drop. Spool pins fake a set to trick you.
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["lockpick", "precision", "focus", "timing", "haptic"].map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  fontSize: 11,
                  letterSpacing: ".06em",
                  color: "#22e0ff",
                  border: "1px solid rgba(34,224,255,.35)",
                  padding: "3px 9px",
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
        <FeelTheLock />
      </div>
    </div>
  );
}
