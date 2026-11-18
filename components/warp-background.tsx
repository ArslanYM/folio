"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  depth: number;
}

const U_STEPS = 56;
const V_STEPS = 22;

/**
 * Architectural 3D parametric warp mesh rendered on HTML5 Canvas.
 * Aesthetic: Swatchbook obsidian, glowing electric chartreuse spine,
 * luminous ivory longitudinal sweeps, and calibrated specimen nodes.
 * Features:
 * - Fluid undulating ribbon-warp geometry with continuous wave motion
 * - Damped 3D rotation following pointer coordinates
 * - Perspective projection with depth shading and atmospheric bloom
 * - Automatically pauses when tab is hidden or prefers-reduced-motion is active
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
    let isTabHidden = document.hidden;
    let time = 0.8;
    let lastTimestamp = 0;

    // Pointer coordinates normalized to [-1, 1]
    let targetMouseX = 0;
    let targetMouseY = 0;
    let mouseX = 0;
    let mouseY = 0;

    function resize() {
      if (!canvas || !ctx) return;
      width = Math.max(320, window.innerWidth);
      height = Math.max(320, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawFrame(t: number) {
      if (!ctx || width === 0 || height === 0) return;
      ctx.clearRect(0, 0, width, height);

      // 1. Ambient atmospheric glow behind the 3D figure
      const glowX = width >= 1024 ? width * 0.64 : width * 0.52;
      const glowY = height * 0.42;
      const glowRadius = Math.min(width, height) * 0.7;

      const radialGrad = ctx.createRadialGradient(
        glowX,
        glowY,
        15,
        glowX,
        glowY,
        glowRadius
      );
      radialGrad.addColorStop(0, "rgba(200, 242, 61, 0.14)");
      radialGrad.addColorStop(0.32, "rgba(200, 242, 61, 0.05)");
      radialGrad.addColorStop(0.68, "rgba(23, 21, 15, 0.02)");
      radialGrad.addColorStop(1, "rgba(14, 13, 11, 0)");

      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // Secondary warmer ambient bloom (hairline amber/umber warmth)
      const amberGrad = ctx.createRadialGradient(
        width >= 1024 ? width * 0.78 : width * 0.65,
        height * 0.28,
        10,
        width >= 1024 ? width * 0.78 : width * 0.65,
        height * 0.28,
        Math.min(width, height) * 0.45
      );
      amberGrad.addColorStop(0, "rgba(242, 237, 226, 0.04)");
      amberGrad.addColorStop(1, "rgba(14, 13, 11, 0)");
      ctx.fillStyle = amberGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Center and scale of the 3D figure
      // Frames the hero heading and specimen catalog card
      const cx = width >= 1024 ? width * 0.62 : width * 0.5;
      const cy = height >= 768 ? height * 0.45 : height * 0.38;
      const scale = Math.min(width, height) * (width >= 1024 ? 0.58 : 0.52);
      const fov = 3.8;

      // 3D rotations with soft damped mouse tilt
      const rotX = 0.54 + mouseY * 0.2 + Math.sin(t * 0.22) * 0.07;
      const rotY = -0.44 + mouseX * 0.26 + Math.cos(t * 0.18) * 0.09;
      const rotZ = -0.2 + Math.sin(t * 0.14) * 0.05;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosZ = Math.cos(rotZ);
      const sinZ = Math.sin(rotZ);

      const grid: ProjectedPoint[][] = [];

      for (let iu = 0; iu <= U_STEPS; iu += 1) {
        const uNorm = iu / U_STEPS; // 0..1
        const u = (uNorm - 0.5) * 2.85; // sweep span
        const row: ProjectedPoint[] = [];

        // Continuous undulating hyperbolic twist
        const twist = u * 1.08 + Math.sin(u * 1.5 - t * 0.7) * 0.4;
        const cosTwist = Math.cos(twist);
        const sinTwist = Math.sin(twist);

        for (let iv = 0; iv <= V_STEPS; iv += 1) {
          const vNorm = iv / V_STEPS;
          const v = (vNorm - 0.5) * 1.65;

          // Organic harmonic ripple
          const ripple =
            Math.sin(u * 2.5 - t * 1.0) * 0.22 +
            Math.cos(v * 3.0 + t * 0.78) * 0.13 +
            Math.sin((u * 1.2 + v) * 2.0 - t * 0.58) * 0.1;

          const baseX = u * 1.24;
          const baseY = v * cosTwist - ripple * sinTwist;
          const baseZ = v * sinTwist + ripple * cosTwist + u * v * 0.3;

          // 3D Matrix rotation: Y -> X -> Z
          const x1 = baseX * cosY + baseZ * sinY;
          const z1 = -baseX * sinY + baseZ * cosY;

          const y2 = baseY * cosX - z1 * sinX;
          const z2 = baseY * sinX + z1 * cosX;

          const x3 = x1 * cosZ - y2 * sinZ;
          const y3 = x1 * sinZ + y2 * cosZ;

          // Perspective projection
          const perspective = fov / (fov + z2 + 2.45);
          const px = cx + x3 * scale * perspective;
          const py = cy + y3 * scale * perspective;

          // Depth metric (0 in back, 1 in front)
          const depth = Math.max(0, Math.min(1, (1.2 - z2) / 2.4));

          row.push({ x: px, y: py, z: z2, depth });
        }
        grid.push(row);
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // 3. Cross-latitude curves (subtle calibrated wireframe ribs)
      for (let iu = 0; iu <= U_STEPS; iu += 2) {
        const row = grid[iu];
        const midDepth = row[Math.floor(V_STEPS / 2)].depth;

        ctx.beginPath();
        for (let iv = 0; iv <= V_STEPS; iv += 1) {
          const pt = row[iv];
          if (iv === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }

        const alpha = 0.14 + midDepth * 0.26;
        ctx.strokeStyle = `rgba(168, 158, 140, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();
      }

      // 4. Longitudinal warp contour curves
      for (let iv = 0; iv <= V_STEPS; iv += 1) {
        const isSpine = iv === Math.floor(V_STEPS / 2);
        const isSubSpine =
          iv === Math.floor(V_STEPS / 4) || iv === Math.floor((3 * V_STEPS) / 4);
        const isOuterEdge = iv === 0 || iv === V_STEPS;

        ctx.beginPath();
        for (let iu = 0; iu <= U_STEPS; iu += 1) {
          const pt = grid[iu][iv];
          if (iu === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }

        if (isSpine) {
          // Main signature spine: electric chartreuse glow
          ctx.strokeStyle = "rgba(200, 242, 61, 0.9)";
          ctx.lineWidth = 2.4;
          ctx.stroke();

          // Soft bloom glow around the chartreuse spine
          ctx.beginPath();
          for (let iu = 0; iu <= U_STEPS; iu += 1) {
            const pt = grid[iu][iv];
            if (iu === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.strokeStyle = "rgba(200, 242, 61, 0.28)";
          ctx.lineWidth = 6.0;
          ctx.stroke();
        } else if (isSubSpine) {
          // Secondary spines: chartreuse-tinted ivory
          ctx.strokeStyle = "rgba(215, 245, 95, 0.68)";
          ctx.lineWidth = 1.4;
          ctx.stroke();
        } else if (isOuterEdge) {
          // Outer borders: crisp ivory
          ctx.strokeStyle = "rgba(242, 237, 226, 0.52)";
          ctx.lineWidth = 1.25;
          ctx.stroke();
        } else {
          // Body warp strands: luminous ivory with depth attenuation
          const rowNorm = Math.abs(iv - V_STEPS / 2) / (V_STEPS / 2);
          const alpha = 0.22 + (1 - rowNorm) * 0.3;
          ctx.strokeStyle = `rgba(242, 237, 226, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      }

      // 5. Specimen intersection calibration nodes (glowing dots & crosshairs)
      for (let iu = 2; iu < U_STEPS; iu += 5) {
        for (let iv = 0; iv <= V_STEPS; iv += 3) {
          const pt = grid[iu][iv];
          const isCenterLine = iv === Math.floor(V_STEPS / 2);

          ctx.beginPath();
          if (isCenterLine) {
            // Chartreuse node with halo
            ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(200, 242, 61, 0.95)";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 6.0, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(200, 242, 61, 0.25)";
            ctx.fill();

            // Architectural crosshair ticks on forward-facing center nodes
            if (pt.depth > 0.65 && iu % 10 === 2) {
              const tick = 5;
              ctx.strokeStyle = "rgba(200, 242, 61, 0.75)";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(pt.x - tick, pt.y);
              ctx.lineTo(pt.x + tick, pt.y);
              ctx.moveTo(pt.x, pt.y - tick);
              ctx.lineTo(pt.x, pt.y + tick);
              ctx.stroke();
            }
          } else {
            // Warm ivory specimen dot
            const radius = 1.2 + pt.depth * 0.6;
            ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(242, 237, 226, ${(0.26 + pt.depth * 0.45).toFixed(3)})`;
            ctx.fill();
          }
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
      if (reduceMotion || isTabHidden) {
        stopLoop();
        return;
      }

      if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
      }
      const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;

      time += dt * 0.7;
      mouseX += (targetMouseX - mouseX) * 0.06;
      mouseY += (targetMouseY - mouseY) * 0.06;

      drawFrame(time);
      rafId = window.requestAnimationFrame(tick);
    }

    function startLoop() {
      if (reduceMotion || isTabHidden) {
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

    resize();
    drawFrame(time);
    startLoop();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      stopLoop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "warp-bg-shell pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-700",
        isHome ? "opacity-100" : "opacity-40"
      )}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
