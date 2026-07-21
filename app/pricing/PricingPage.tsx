"use client";

import { useState } from "react";
import MarketplaceChrome, {
  type MarqueeItem,
} from "../_components/MarketplaceChrome";

const FONT_DISPLAY = "var(--font-chakra-petch), sans-serif";
const FONT_MONO = "var(--font-ibm-plex-mono), monospace";

type TierId = "hobbyist" | "indie" | "enterprise";

type Tier = {
  id: TierId;
  name: string;
  kicker: string;
  accent: string;
  glow: string;
  price: string;
  unit: string;
  sub: string;
  cta: string;
  tag?: string;
  features: string[];
};

const TIERS: Tier[] = [
  {
    id: "hobbyist",
    name: "Hobbyist",
    kicker: "FREE FOREVER",
    accent: "#22e0ff",
    glow: "rgba(34,224,255,.5)",
    price: "$0",
    unit: "",
    sub: "No card required",
    cta: "START FREE",
    features: [
      "The whole mechanic library",
      "Personal & game-jam projects",
      "Game Loops splash on load screen",
    ],
  },
  {
    id: "indie",
    name: "Indie",
    kicker: "MOST POPULAR",
    accent: "#ff2d9c",
    glow: "rgba(255,45,156,.55)",
    price: "$149",
    unit: "one-time",
    sub: "per project · yours forever",
    cta: "GET INDIE",
    tag: "BEST VALUE",
    features: [
      "Everything in Hobbyist",
      "Ship in one commercial project",
      "Up to 15 people on the dev team and/or a publisher",
      "No splash screen",
      "Free updates for that project",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    kicker: "STUDIOS & TEAMS",
    accent: "#ffcf5c",
    glow: "rgba(255,207,92,.45)",
    price: "$599",
    unit: "one-time",
    sub: "per project · yours forever",
    cta: "GET ENTERPRISE",
    features: [
      "Everything in Indie",
      "Unlimited people on the project team",
      "Commercial redistribution rights",
      "Invoicing & PO billing",
    ],
  },
];

const MARQUEE: MarqueeItem[] = [
  { text: "◆ ONE LICENSE · EVERY MECHANIC", color: "#22e0ff" },
  { text: "◆ PER-PROJECT · YOURS FOREVER" },
  { text: "◆ PLAY EVERY LOOP FREE", color: "#ff2d9c" },
  { text: "◆ UNITY · GODOT · UNREAL · WEB" },
];

export default function PricingPage() {
  const [selected, setSelected] = useState<TierId>("indie");
  const selectedTier = TIERS.find((t) => t.id === selected)!;
  const isFree = selectedTier.price === "$0";

  return (
    <MarketplaceChrome active="pricing" marquee={MARQUEE}>
      <Header />
      <TierGrid selected={selected} onSelect={setSelected} />
      <ComparisonNote />
      <LicenseForm
        selected={selected}
        onSelect={setSelected}
        selectedTier={selectedTier}
        isFree={isFree}
      />
    </MarketplaceChrome>
  );
}

function Header() {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        maxWidth: 1280,
        margin: "0 auto",
        textAlign: "center",
        padding: "48px 48px 12px",
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 13,
          letterSpacing: ".24em",
          color: "#22e0ff",
          marginBottom: 18,
        }}
      >
        ▚ ONE PRICE PER PROJECT
      </div>
      <h1
        style={{
          margin: 0,
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: "clamp(38px, 6vw, 60px)",
          lineHeight: 1.02,
          letterSpacing: "-.01em",
          color: "#fff",
          textShadow: "0 0 44px rgba(255,45,156,.3)",
          textWrap: "balance",
        }}
      >
        PICK A TIER.
        <br />
        <span style={{ color: "#ff2d9c" }}>UNLOCK EVERY</span>{" "}
        <span style={{ color: "#22e0ff" }}>LOOP.</span>
      </h1>
      <p
        style={{
          maxWidth: 560,
          margin: "22px auto 0",
          fontSize: 17,
          lineHeight: 1.6,
          color: "#b7b7c4",
          textWrap: "pretty",
        }}
      >
        Play-test every mechanic for free, forever. When you&apos;re ready to
        ship, buy one license and use <em>every</em> mechanic in your project —
        no per-mechanic checkout, no surprises.
      </p>
    </div>
  );
}

function TierGrid({
  selected,
  onSelect,
}: {
  selected: TierId;
  onSelect: (id: TierId) => void;
}) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        maxWidth: 1280,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 20,
        padding: "24px 48px 8px",
        alignItems: "stretch",
      }}
    >
      {TIERS.map((t) => (
        <TierCard
          key={t.id}
          tier={t}
          isSelected={t.id === selected}
          onSelect={() => onSelect(t.id)}
        />
      ))}
    </div>
  );
}

function TierCard({
  tier,
  isSelected,
  onSelect,
}: {
  tier: Tier;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="gl-card"
      style={{
        appearance: "none",
        textAlign: "left",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        background: "#0b0714",
        border: `1px solid ${isSelected ? tier.accent : "rgba(255,255,255,.1)"}`,
        boxShadow: isSelected ? `0 18px 50px ${tier.glow}` : "none",
        padding: "30px 26px 28px",
        cursor: "pointer",
        transition: "border-color .2s, box-shadow .2s",
      }}
    >
      {tier.tag && (
        <span
          style={{
            position: "absolute",
            top: -11,
            left: 26,
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: ".14em",
            background: "#ff2d9c",
            color: "#0a0410",
            padding: "4px 10px",
            boxShadow: "0 0 16px rgba(255,45,156,.6)",
          }}
        >
          {tier.tag}
        </span>
      )}
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 12,
          letterSpacing: ".18em",
          color: tier.accent,
        }}
      >
        {tier.kicker}
      </div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: ".03em",
          color: "#fff",
          margin: "8px 0 16px",
        }}
      >
        {tier.name}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 46,
            lineHeight: 1,
            color: tier.accent,
          }}
        >
          {tier.price}
        </span>
        {tier.unit && (
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 13,
              color: "#8a8a95",
            }}
          >
            {tier.unit}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 12,
          color: "#8a8a95",
          marginTop: 6,
          minHeight: 16,
        }}
      >
        {tier.sub}
      </div>
      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,.08)",
          margin: "20px 0",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 11,
          flex: 1,
        }}
      >
        {tier.features.map((f) => (
          <div
            key={f}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              fontSize: 14,
              lineHeight: 1.4,
              color: "#c7c7d2",
            }}
          >
            <span
              style={{
                color: tier.accent,
                flex: "0 0 auto",
                fontFamily: FONT_MONO,
              }}
            >
              ▸
            </span>
            <span>{f}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        style={{
          marginTop: 24,
          border: 0,
          width: "100%",
          padding: "14px 0",
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: ".1em",
          cursor: "pointer",
          background: isSelected ? tier.accent : "transparent",
          color: isSelected ? "#0a0410" : "#fff",
          boxShadow: isSelected
            ? `0 0 22px ${tier.glow}`
            : "inset 0 0 0 1px rgba(255,255,255,.2)",
        }}
      >
        {tier.cta}
      </button>
    </button>
  );
}

function ComparisonNote() {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        maxWidth: 1280,
        margin: "0 auto",
        textAlign: "center",
        padding: "12px 48px 4px",
        fontFamily: FONT_MONO,
        fontSize: 12,
        color: "#6a6a76",
        letterSpacing: ".04em",
      }}
    >
      Every tier includes the full library · source for Unity · Godot · Unreal ·
      Web · free updates for the license term
    </div>
  );
}

function LicenseForm({
  selected,
  onSelect,
  selectedTier,
  isFree,
}: {
  selected: TierId;
  onSelect: (id: TierId) => void;
  selectedTier: Tier;
  isFree: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        maxWidth: 760,
        margin: "44px auto 0",
        padding: "0 24px 72px",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "linear-gradient(180deg,#0c0716,#0a0510)",
          border: "1px solid rgba(255,45,156,.3)",
          boxShadow: "0 0 60px rgba(255,45,156,.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255,255,255,.08)",
            fontFamily: FONT_MONO,
            fontSize: 12,
            letterSpacing: ".1em",
            color: "#9a9aa6",
          }}
        >
          <span style={{ color: "#ff2d9c" }}>
            <span className="gl-anim-pulse">●</span> LICENSE FORM
          </span>
          <span>1 project · 1 license</span>
        </div>
        <div style={{ padding: "clamp(20px, 3vw, 34px)" }}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 24,
              color: "#fff",
              letterSpacing: ".02em",
            }}
          >
            Claim your license
          </div>
          <p
            style={{
              margin: "8px 0 24px",
              fontSize: 14,
              lineHeight: 1.55,
              color: "#9a9aa6",
            }}
          >
            Tell us about your project. A license covers a single shipped
            game — starting a new project? Grab a new license.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px 18px",
            }}
          >
            <FormField label="YOUR NAME / STUDIO" placeholder="e.g. Neon Fox Games" />
            <FormField label="EMAIL" type="email" placeholder="you@studio.gg" />
            <FormField
              label="PROJECT / GAME TITLE"
              placeholder="Working title is fine"
            />
            <FormSelect
              label="TARGET ENGINE"
              options={["Unity", "Godot", "Unreal", "Web / JS", "Other"]}
            />
          </div>

          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              letterSpacing: ".12em",
              color: "#8a8a95",
              margin: "24px 0 10px",
            }}
          >
            SELECTED TIER
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            {TIERS.map((t) => {
              const on = t.id === selected;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelect(t.id)}
                  style={{
                    appearance: "none",
                    textAlign: "left",
                    border: `1px solid ${on ? t.accent : "rgba(255,255,255,.14)"}`,
                    background: on ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.3)",
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "all .18s",
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontWeight: 700,
                      fontSize: 15,
                      color: "#fff",
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: 12,
                      color: t.accent,
                      marginTop: 3,
                    }}
                  >
                    {t.price} {t.unit}
                  </div>
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginTop: 26,
              paddingTop: 22,
              borderTop: "1px solid rgba(255,255,255,.08)",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: "#8a8a95",
                }}
              >
                DUE TODAY
              </div>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 700,
                  fontSize: 32,
                  color: "#fff",
                }}
              >
                {selectedTier.price}{" "}
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: 13,
                    color: "#8a8a95",
                    fontWeight: 400,
                  }}
                >
                  {isFree ? "" : "one-time · per project"}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="gl-btn-magenta"
              style={{
                border: 0,
                padding: "16px 32px",
                fontFamily: FONT_DISPLAY,
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: ".1em",
                cursor: "pointer",
                background: "#ff2d9c",
                color: "#0a0410",
                boxShadow: "0 0 22px rgba(255,45,156,.55)",
              }}
            >
              {isFree ? "CLAIM FREE LICENSE →" : "CLAIM LICENSE →"}
            </button>
          </div>
          <p
            style={{
              margin: "16px 0 0",
              fontFamily: FONT_MONO,
              fontSize: 11,
              lineHeight: 1.5,
              color: "#6a6a76",
            }}
          >
            By claiming a license you agree to the per-project terms. Refunds
            within 14 days if you haven&apos;t shipped. Questions?
            hello@gameloops.gg
          </p>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          letterSpacing: ".12em",
          color: "#8a8a95",
        }}
      >
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="gl-input"
        style={{
          background: "rgba(0,0,0,.5)",
          border: "1px solid rgba(255,255,255,.16)",
          outline: "none",
          color: "#fff",
          padding: "13px 14px",
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: 14,
          transition: "border-color .18s",
        }}
      />
    </label>
  );
}

function FormSelect({
  label,
  options,
}: {
  label: string;
  options: string[];
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 11,
          letterSpacing: ".12em",
          color: "#8a8a95",
        }}
      >
        {label}
      </span>
      <select
        className="gl-input"
        style={{
          background: "rgba(0,0,0,.5)",
          border: "1px solid rgba(255,255,255,.16)",
          outline: "none",
          color: "#fff",
          padding: "13px 14px",
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontSize: 14,
          transition: "border-color .18s",
        }}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
