import Execute from "./Execute";

export const metadata = {
  title: "Execute · Game Loops",
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
            ▚ LOOP // 002
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
            EXEC<span style={{ color: "#ff2d9c" }}>UTE.</span>
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
            Read the command, cut the right wires, ignore the fakes. Only orders
            prefixed with{" "}
            <span
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                color: "#46f0a0",
              }}
            >
              EXECUTE
            </span>{" "}
            should be followed — anything else is a trap. Rounds get faster.
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["diffuse", "wire", "focus", "reflex"].map((t) => (
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
        <Execute />
      </div>
    </div>
  );
}
