"use client";

import { useState } from "react";
import MarketplaceChrome, {
  type MarqueeItem,
} from "../_components/MarketplaceChrome";

const FONT_DISPLAY = "var(--font-chakra-petch), sans-serif";
const FONT_MONO = "var(--font-ibm-plex-mono), monospace";

type TopicId = "general" | "mechanic" | "bug" | "license";

const TOPICS: { id: TopicId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "mechanic", label: "Suggest a mechanic" },
  { id: "bug", label: "Report a bug" },
  { id: "license", label: "Licensing" },
];

const CHANNELS = [
  {
    glyph: "✉",
    label: "Email us",
    value: "hello@gameloops.gg",
    href: "mailto:hello@gameloops.gg",
    color: "#ff2d9c",
    glow: "rgba(255,45,156,.35)",
  },
  {
    glyph: "◈",
    label: "Discord",
    value: "discord.gg/gameloops",
    href: "#",
    color: "#22e0ff",
    glow: "rgba(34,224,255,.35)",
  },
  {
    glyph: "?",
    label: "Docs & FAQ",
    value: "docs.gameloops.gg",
    href: "#",
    color: "#46f0a0",
    glow: "rgba(70,240,160,.3)",
  },
];

const MARQUEE: MarqueeItem[] = [
  { text: "◆ SAY HELLO", color: "#22e0ff" },
  { text: "◆ WE READ EVERY MESSAGE" },
  { text: "◆ SUGGEST A MECHANIC", color: "#ff2d9c" },
  { text: "◆ UNITY · GODOT · UNREAL · WEB" },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [topic, setTopic] = useState<TopicId>("general");

  return (
    <MarketplaceChrome active="contact" marquee={MARQUEE}>
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1120,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 52,
          padding: "56px clamp(24px, 4vw, 48px) 72px",
          alignItems: "start",
        }}
      >
        <IntroColumn />
        <FormPanel
          sent={sent}
          topic={topic}
          onTopic={setTopic}
          onSend={() => setSent(true)}
          onReset={() => setSent(false)}
        />
      </div>
    </MarketplaceChrome>
  );
}

function IntroColumn() {
  return (
    <div>
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 13,
          letterSpacing: ".24em",
          color: "#22e0ff",
          marginBottom: 18,
        }}
      >
        ▚ PLAYER TWO HAS ENTERED
      </div>
      <h1
        style={{
          margin: 0,
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: "clamp(36px, 5.5vw, 56px)",
          lineHeight: 1.02,
          letterSpacing: "-.01em",
          color: "#fff",
          textShadow: "0 0 44px rgba(255,45,156,.3)",
          textWrap: "balance",
        }}
      >
        GET IN
        <br />
        <span style={{ color: "#ff2d9c" }}>TOUCH.</span>
      </h1>
      <p
        style={{
          maxWidth: 400,
          margin: "22px 0 32px",
          fontSize: 17,
          lineHeight: 1.6,
          color: "#b7b7c4",
          textWrap: "pretty",
        }}
      >
        Bug in a loop? Idea for a mechanic you wish existed? Licensing question
        for a bigger project? Drop us a line — a real human reads every
        message.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {CHANNELS.map((ch) => (
          <a
            key={ch.label}
            href={ch.href}
            className="gl-channel"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "#0b0714",
              border: "1px solid rgba(255,255,255,.1)",
              padding: "16px 18px",
              transition: "border-color .2s, transform .2s",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                flex: "0 0 auto",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${ch.color}`,
                color: ch.color,
                fontFamily: FONT_MONO,
                fontSize: 16,
                boxShadow: `0 0 14px ${ch.glow}`,
              }}
            >
              {ch.glyph}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#fff",
                }}
              >
                {ch.label}
              </span>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  color: "#9a9aa6",
                }}
              >
                {ch.value}
              </span>
            </span>
          </a>
        ))}
      </div>

      <div
        style={{
          marginTop: 26,
          fontFamily: FONT_MONO,
          fontSize: 12,
          lineHeight: 1.7,
          color: "#6a6a76",
        }}
      >
        <div>
          <span style={{ color: "#22e0ff" }}>›</span> Typical reply time: within
          1 business day
        </div>
        <div>
          <span style={{ color: "#22e0ff" }}>›</span> Support hours: Mon–Fri,
          9–6 (CET)
        </div>
      </div>
    </div>
  );
}

function FormPanel({
  sent,
  topic,
  onTopic,
  onSend,
  onReset,
}: {
  sent: boolean;
  topic: TopicId;
  onTopic: (id: TopicId) => void;
  onSend: () => void;
  onReset: () => void;
}) {
  return (
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
          <span className="gl-anim-pulse">●</span> NEW MESSAGE
        </span>
        <span>send.loop</span>
      </div>

      {sent ? (
        <div style={{ padding: "56px 34px", textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: "clamp(30px, 5vw, 40px)",
              color: "#46f0a0",
              textShadow: "0 0 24px rgba(70,240,160,.5)",
            }}
          >
            MESSAGE SENT ✓
          </div>
          <p
            style={{
              margin: "14px auto 26px",
              maxWidth: 340,
              fontSize: 15,
              lineHeight: 1.55,
              color: "#b7b7c4",
            }}
          >
            Nice one — your message is in the queue. We&apos;ll get back to you
            at your email within a business day.
          </p>
          <button
            type="button"
            onClick={onReset}
            style={{
              border: 0,
              padding: "13px 26px",
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: ".1em",
              cursor: "pointer",
              background: "transparent",
              color: "#fff",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,.25)",
            }}
          >
            SEND ANOTHER
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          style={{ padding: "28px clamp(20px, 3vw, 34px) 32px" }}
        >
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 11,
              letterSpacing: ".12em",
              color: "#8a8a95",
              marginBottom: 10,
            }}
          >
            WHAT&apos;S THIS ABOUT?
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 22,
            }}
          >
            {TOPICS.map((tp) => {
              const on = tp.id === topic;
              return (
                <button
                  key={tp.id}
                  type="button"
                  onClick={() => onTopic(tp.id)}
                  style={{
                    appearance: "none",
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    letterSpacing: ".04em",
                    padding: "8px 14px",
                    cursor: "pointer",
                    border: `1px solid ${on ? "#22e0ff" : "rgba(255,255,255,.16)"}`,
                    color: on ? "#22e0ff" : "#c7c7d2",
                    background: on ? "rgba(34,224,255,.1)" : "transparent",
                    transition: "all .18s",
                  }}
                >
                  {tp.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px 18px",
            }}
          >
            <FormField
              label="YOUR NAME / STUDIO"
              placeholder="e.g. Neon Fox Games"
              required
            />
            <FormField
              label="EMAIL"
              type="email"
              placeholder="you@studio.gg"
              required
            />
          </div>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 7,
              marginTop: 16,
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                letterSpacing: ".12em",
                color: "#8a8a95",
              }}
            >
              MESSAGE
            </span>
            <textarea
              rows={5}
              required
              placeholder="Tell us what's up…"
              className="gl-input"
              style={{
                resize: "vertical",
                background: "rgba(0,0,0,.5)",
                border: "1px solid rgba(255,255,255,.16)",
                outline: "none",
                color: "#fff",
                padding: "13px 14px",
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontSize: 14,
                lineHeight: 1.5,
                transition: "border-color .18s",
              }}
            />
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginTop: 24,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 11,
                color: "#6a6a76",
              }}
            >
              We&apos;ll only use your email to reply.
            </span>
            <button
              type="submit"
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
              SEND MESSAGE →
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function FormField({
  label,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
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
        required={required}
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
