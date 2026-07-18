import SplitFocus from "./SplitFocus";

export const metadata = {
  title: "Split Focus · Game Loops",
};

export default function Page() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 24px 48px",
      }}
    >
      <div style={{ width: 900 }}>
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
            ▚ LOOP // 001
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-chakra-petch), sans-serif",
              fontWeight: 700,
              fontSize: 44,
              letterSpacing: "-.01em",
              color: "#fff",
              textShadow: "0 0 30px rgba(255,45,156,.28)",
            }}
          >
            SPLIT <span style={{ color: "#ff2d9c" }}>FOCUS.</span>
          </h1>
          <p
            style={{
              maxWidth: 640,
              margin: "12px 0 12px",
              color: "#b7b7c4",
              fontSize: 15,
              lineHeight: 1.55,
            }}
          >
            Three tasks. One brain. Keep the cursor in the ring, react to the
            right blocks, and solve the math before the meter drains. Miss any
            of them and stability drops.
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["focus", "multitask", "reflex", "timing"].map((t) => (
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
        <SplitFocus />
      </div>
    </div>
  );
}
