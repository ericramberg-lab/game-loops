import ChainReaction from "./ChainReaction";

export const metadata = {
  title: "Chain Reaction · Game Loops",
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
            ▚ LOOP // 004
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
            CHAIN <span style={{ color: "#ff2d9c" }}>REACTION.</span>
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
            Every move ripples. Raising a pin drops its neighbors, and vice
            versa. Align every pin with the shear line — but pins don&apos;t
            stick, so plan the chain carefully.
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["lockpick", "puzzle", "focus"].map((t) => (
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
        <ChainReaction />
      </div>
    </div>
  );
}
