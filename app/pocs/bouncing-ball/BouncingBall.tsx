"use client";

import { useEffect, useRef } from "react";

export default function BouncingBall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let x = width / 2;
    let y = height / 2;
    let vx = 3;
    let vy = 2.4;
    const radius = 18;
    let raf = 0;

    const step = () => {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, width, height);

      x += vx;
      y += vy;
      if (x - radius < 0 || x + radius > width) vx = -vx;
      if (y - radius < 0 || y + radius > height) vy = -vy;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#f5f5f5";
      ctx.fill();

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-[480px] w-full rounded-lg bg-black"
      style={{ display: "block" }}
    />
  );
}
