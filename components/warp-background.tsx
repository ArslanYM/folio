"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  crest: number;
}

const U_STEPS = 44;
const V_STEPS = 16;

/**
 * Architectural 3D parametric warp mesh rendered on HTML5 Canvas using
 * Swatchbook's warm obsidian, hairline umber, ivory, and chartreuse accent palette.
 * Pauses automatically when off-screen (contentvisibilityautostatechange / IntersectionObserver),
 * when the browser tab is hidden, or when prefers-reduced-motion is enabled.
 */
export function WarpBackground() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isHome = pathname === "/";

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = motionQuery.matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId: number | null = null;
    let isSkipped = false;
    let isTabHidden = document.hidden;
    let time = 0.65;
    let lastTimestamp = 0;

    // Gentle damped pointer parallax in [-1, 1]
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    function resize() {
      if (!container || !canvas || !ctx) return;
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawFrame(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Anchor sculptural warp slightly to the right & upper-middle on wide viewports
      const cx = width >= 1024 ? width * 0.64 : width * 0.54;
      const cy = height * 0.46;
      const scale = Math.min(width, height) * (width >= 1024 ? 0.52 : 0.46);
      const fov = 3.8;

      // Smoothly rotate the 3D figure with subtle cursor tilt
      const rotX = 0.52 + mouseY * 0.16 + Math.sin(t * 0.28) * 0.06;
      const rotY = -0.34 + mouseX * 0.22 + Math.cos(t * 0.22) * 0.09;
      const rotZ = -0.18 + Math.sin(t * 0.17) * 0.04;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosZ = Math.cos(rotZ);
      const sinZ = Math.sin(rotZ);

      const grid: ProjectedPoint[][] = [];

      for (let iu = 0; iu <= U_STEPS; iu += 1) {
        const uNorm = iu / U_STEPS; // 0..1
        const u = (uNorm - 0.5) * 2.55; // horizontal sweep
        const row: ProjectedPoint[] = [];

        // Parametric ribbon twist + organic warp wave
        const twist = u * 0.92 + Math.sin(u * 1.4 - t * 0.65) * 0.34;
        const cosTwist = Math.cos(twist);
        const sinTwist = Math.sin(twist);

        for (let iv = 0; iv <= V_STEPS; iv += 1) {
          const vNorm = iv / V_STEPS;
          const v = (vNorm - 0.5) * 1.42;

          // Base hyperbolic warp + traveling sinusoidal ripple
          const ripple =
            Math.sin(u * 2.4 - t * 0.95) * 0.19 +
            Math.cos(v * 2.8 + t * 0.72) * 0.11 +
            Math.sin((u + v) * 1.8 - t * 0.55) * 0.09;

          const baseX = u * 1.12;
          const baseY = v * cosTwist - ripple * sinTwist;
          const baseZ = v * sinTwist + ripple * cosTwist + u * v * 0.28;

          // 3D rotation (Y -> X -> Z)
          const x1 = baseX * cosY + baseZ * sinY;
          const z1 = -baseX * sinY + baseZ * cosY;

          const y2 = baseY * cosX - z1 * sinX;
          const z2 = baseY * sinX + z1 * cosX;

          const x3 = x1 * cosZ - y2 * sinZ;
          const y3 = x1 * sinZ + y2 * cosZ;

          const perspective = fov / (fov + z2 + 2.35);
          const px = cx + x3 * scale * perspective;
          const py = cy + y3 * scale * perspective;

          // Crest intensity used for subtle chartreuse highlight on forward ridges
          const crest = Math.max(0, Math.min(1, (0.65 - z2) * 0.65));

          row.push({ x: px, y: py, z: z2, crest });
        }
        grid.push(row);
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // 1. Cross-rib latitude curves (subtle warm umber hairlines)
      for (let iu = 0; iu <= U_STEPS; iu += 2) {
        const row = grid[iu];
        const avgCrest = row[Math.floor(V_STEPS / 2)].crest;
        ctx.beginPath();
        for (let iv = 0; iv <= V_STEPS; iv += 1) {
          const pt = row[iv];
          if (iv === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        const alpha = 0.07 + avgCrest * 0.14;
        ctx.strokeStyle = `rgba(143, 136, 122, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 0.75;
        ctx.stroke();
      }

      // 2. Flowing longitude warp lines (warm ivory + electric chartreuse signature edge curves)
      for (let iv = 0; iv <= V_STEPS; iv += 1) {
        const isEdge = iv === 0 || iv === V_STEPS;
        const isAccentSpine = iv === Math.floor(V_STEPS / 2) || iv === 2;

        ctx.beginPath();
        for (let iu = 0; iu <= U_STEPS; iu += 1) {
          const pt = grid[iu][iv];
          if (iu === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }

        if (isAccentSpine) {
          ctx.strokeStyle = "rgba(200, 242, 61, 0.34)";
          ctx.lineWidth = 1.1;
        } else if (isEdge) {
          ctx.strokeStyle = "rgba(242, 237, 226, 0.24)";
          ctx.lineWidth = 1.0;
        } else {
          ctx.strokeStyle = "rgba(242, 237, 226, 0.11)";
          ctx.lineWidth = 0.8;
        }
        ctx.stroke();
      }

      // 3. Specimen calibration vertex dots at select intersections
      for (let iu = 2; iu < U_STEPS; iu += 6) {
        for (let iv = 0; iv <= V_STEPS; iv += 4) {
          const pt = grid[iu][iv];
          const isChartreuseNode = iv === Math.floor(V_STEPS / 2) && iu % 12 === 2;
          const radius = isChartreuseNode ? 1.8 : 1.1;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = isChartreuseNode
            ? `rgba(200, 242, 61, ${(0.4 + pt.crest * 0.45).toFixed(3)})`
            : `rgba(242, 237, 226, ${(0.12 + pt.crest * 0.22).toFixed(3)})`;
          ctx.fill();
        }
      }
    }

    function stopLoop() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTimestamp = 0;
    }

    function tick(timestamp: number) {
      if (reduceMotion || isSkipped || isTabHidden) {
        stopLoop();
        return;
      }

      if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
      }
      const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;

      time += dt * 0.65;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      drawFrame(time);
      rafId = window.requestAnimationFrame(tick);
    }

    function startLoop() {
      if (reduceMotion || isSkipped || isTabHidden) {
        drawFrame(time);
        return;
      }
      if (rafId === null) {
        lastTimestamp = 0;
        rafId = window.requestAnimationFrame(tick);
      }
    }

    function handlePointerMove(e: PointerEvent) {
      if (reduceMotion) return;
      targetMouseX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      targetMouseY = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    }

    function handleVisibilityChange() {
      isTabHidden = document.hidden;
      if (isTabHidden) {
        stopLoop();
      } else {
        startLoop();
      }
    }

    function handleMotionChange(e: MediaQueryListEvent) {
      reduceMotion = e.matches;
      if (reduceMotion) {
        stopLoop();
        drawFrame(time);
      } else {
        startLoop();
      }
    }

    // Pause rendering loop when container is skipped by content-visibility: auto
    const handleContentVisibility = (event: Event) => {
      const skipped = (event as Event & { skipped?: boolean }).skipped;
      isSkipped = Boolean(skipped);
      if (isSkipped) {
        stopLoop();
      } else {
        startLoop();
      }
    };

    resize();
    drawFrame(time);
    startLoop();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionQuery.addEventListener("change", handleMotionChange);
    container.addEventListener(
      "contentvisibilityautostatechange",
      handleContentVisibility
    );

    // Fallback for browsers without content-visibility support
    let observer: IntersectionObserver | null = null;
    if (!("contentVisibility" in document.documentElement.style)) {
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.some((entry) => entry.isIntersecting);
          isSkipped = !visible;
          if (isSkipped) stopLoop();
          else startLoop();
        },
        { rootMargin: "200px" }
      );
      observer.observe(container);
    }

    return () => {
      stopLoop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.removeEventListener("change", handleMotionChange);
      container.removeEventListener(
        "contentvisibilityautostatechange",
        handleContentVisibility
      );
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "warp-bg-shell pointer-events-none fixed inset-x-0 top-0 -z-10 h-[760px] max-h-screen overflow-hidden transition-opacity duration-500",
        isHome ? "opacity-95" : "opacity-35"
      )}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
