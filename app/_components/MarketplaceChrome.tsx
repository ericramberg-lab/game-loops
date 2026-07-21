import Link from "next/link";

const FONT_DISPLAY = "var(--font-chakra-petch), sans-serif";
const FONT_MONO = "var(--font-ibm-plex-mono), monospace";

export type MarqueeItem = { text: string; color?: string };
export type NavKey = "browse" | "engines" | "pricing" | "contact";

export default function MarketplaceChrome({
  active,
  marquee,
  children,
}: {
  active?: NavKey;
  marquee: MarqueeItem[];
  children: React.ReactNode;
}) {
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
      <Background />
      <TopAccent />
      <Marquee items={marquee} />
      <Nav active={active} />
      {children}
      <Footer />
    </div>
  );
}

function Background() {
  return (
    <>
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
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 60% at 50% -12%, rgba(255,45,156,.2), transparent 55%), radial-gradient(90% 60% at 4% -6%, rgba(34,224,255,.14), transparent 55%)",
          pointerEvents: "none",
        }}
      />
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
    </>
  );
}

function TopAccent() {
  return (
    <div
      style={{
        position: "relative",
        height: 3,
        background: "linear-gradient(90deg,#ff2d9c,#22e0ff)",
      }}
    />
  );
}

function Marquee({ items }: { items: MarqueeItem[] }) {
  return (
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
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            style={{ padding: "0 22px", color: item.color ?? "#9a9aa6" }}
          >
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function Nav({ active }: { active?: NavKey }) {
  const links: { key: NavKey; label: string; href: string }[] = [
    { key: "browse", label: "Browse", href: "/" },
    { key: "engines", label: "Engines", href: "#" },
    { key: "pricing", label: "Pricing", href: "/pricing" },
    { key: "contact", label: "Contact", href: "/contact" },
  ];
  return (
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
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 36,
            height: 36,
            transform: "skewX(-6deg)",
            marginRight: 8,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "2px solid #ff2d9c",
              boxShadow: "0 0 16px rgba(255,45,156,.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              color: "#ff2d9c",
            }}
          >
            GL
          </div>
          <div
            style={{
              position: "absolute",
              right: -11,
              top: "50%",
              transform: "translateY(-50%)",
              width: 0,
              height: 0,
              borderTop: "6px solid transparent",
              borderBottom: "6px solid transparent",
              borderLeft: "10px solid #22e0ff",
              filter: "drop-shadow(0 0 6px rgba(34,224,255,.85))",
            }}
          />
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
      </Link>
      <nav
        style={{
          display: "flex",
          gap: 32,
          fontFamily: FONT_MONO,
          fontSize: 13,
          letterSpacing: ".06em",
          flexWrap: "wrap",
        }}
      >
        {links.map((l) => {
          const isActive = active === l.key;
          return (
            <Link
              key={l.key}
              href={l.href}
              className={isActive ? undefined : "gl-nav-link"}
              style={{
                color: isActive ? "#ff2d9c" : "#c3c3ce",
              }}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <a
          href="#"
          className="gl-nav-link"
          style={{ fontFamily: FONT_MONO, fontSize: 13 }}
        >
          Sign in
        </a>
        <Link
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
            textDecoration: "none",
          }}
        >
          INSERT COIN
        </Link>
      </div>
    </div>
  );
}

function Footer() {
  return (
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
        flexWrap: "wrap",
        gap: 12,
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
  );
}
