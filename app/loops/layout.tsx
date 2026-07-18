import Link from "next/link";

export default function LoopsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col" style={{ background: "#050408" }}>
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,.08)",
          background: "rgba(0,0,0,.45)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 48px",
            fontFamily: "var(--font-ibm-plex-mono), monospace",
            fontSize: 13,
            letterSpacing: ".08em",
          }}
        >
          <Link
            href="/"
            className="gl-nav-link"
            style={{ color: "#c3c3ce" }}
          >
            ← BACK TO MARKETPLACE
          </Link>
          <span style={{ color: "#22e0ff" }}>▚ GAME LOOPS</span>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
