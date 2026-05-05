"use client";

import React, { useEffect, useRef, useState } from "react";

interface Props {
  type: "pendulum" | "spring" | "projectile" | "none";
  paramValue: number;
}

export default function PendulumSim({ type, paramValue }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (type === "none" || !containerRef.current) return;

    let cancelled = false;

    const init = async () => {
      try {
        const Matter = (await import("matter-js")).default;
        if (cancelled) return;

        const { Engine, Render, Runner, Bodies, Body, Composite, Constraint } = Matter;

        // Clear previous canvas (React StrictMode double-mount safety)
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        const width = 300;
        const height = 300;

        const engine = Engine.create({ gravity: { y: 1 } });
        const render = Render.create({
          element: containerRef.current!,
          engine,
          options: {
            width,
            height,
            background: "#000000",
            wireframes: false,
          },
        });

        if (type === "pendulum") {
          const anchorX = 150;
          const anchorY = 50;
          const length = 50 + paramValue * 15;
          const bob = Bodies.circle(anchorX + length * 0.8, anchorY + length * 0.6, 20, {
            render: { fillStyle: "#ffffff" },
            frictionAir: 0.001,
            restitution: 0.9,
          });
          const anchor = Bodies.circle(anchorX, anchorY, 5, {
            isStatic: true,
            render: { fillStyle: "#00ff41" },
          });
          const constraint = Constraint.create({
            bodyA: anchor,
            bodyB: bob,
            length,
            stiffness: 0.9,
            render: { strokeStyle: "#00ff41", lineWidth: 2 },
          });
          Body.setVelocity(bob, { x: 5, y: 0 });
          Composite.add(engine.world, [anchor, bob, constraint]);
        }

        if (type === "spring") {
          const anchorX = 150;
          const anchorY = 30;
          const length = 50 + paramValue * 15;
          const stiffness = 0.01 + (paramValue / 10) * 0.09;
          const mass = Bodies.rectangle(anchorX, anchorY + length, 40, 40, {
            render: { fillStyle: "#ffffff" },
            frictionAir: 0.05,
          });
          const anchor = Bodies.circle(anchorX, anchorY, 5, {
            isStatic: true,
            render: { fillStyle: "#00ff41" },
          });
          const spring = Constraint.create({
            bodyA: anchor,
            bodyB: mass,
            length: 100,
            stiffness,
            damping: 0.02,
            render: { strokeStyle: "#00ff41", lineWidth: 2 },
          });
          Body.setPosition(mass, { x: anchorX, y: anchorY + 250 });
          Composite.add(engine.world, [anchor, mass, spring]);
        }

        if (type === "projectile") {
          const force = paramValue * 0.01;
          const ball = Bodies.circle(20, 250, 15, {
            render: { fillStyle: "#ffffff" },
            frictionAir: 0,
          });
          const ground = Bodies.rectangle(150, 295, 300, 10, {
            isStatic: true,
            render: { fillStyle: "#333" },
          });
          Body.setVelocity(ball, { x: force * 400, y: -force * 400 });
          Composite.add(engine.world, [ball, ground]);

          // Reset interval
          const resetInterval = setInterval(() => {
            if (cancelled) return;
            Body.setPosition(ball, { x: 20, y: 250 });
            Body.setVelocity(ball, { x: force * 400, y: -force * 400 });
          }, 3000);

          (engine as any)._resetInterval = resetInterval;
        }

        const runner = Runner.create();
        Render.run(render);
        Runner.run(runner, engine);

        cleanupRef.current = () => {
          if ((engine as any)._resetInterval) {
            clearInterval((engine as any)._resetInterval);
          }
          Render.stop(render);
          Runner.stop(runner);
          Engine.clear(engine);
          if (render.canvas) {
            render.canvas.remove();
          }
          if (containerRef.current) {
            containerRef.current.innerHTML = "";
          }
        };
      } catch (err) {
        console.error("Failed to load matter-js", err);
        if (!cancelled) setHasError(true);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [type, paramValue]);

  if (type === "none") {
    return (
      <div
        style={{
          border: "1px solid #333",
          padding: "24px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "monospace",
          color: "#666",
          background: "#000",
        }}
      >
        <span style={{ opacity: 0.5 }}>NO_SIMULATION_REQUIRED //</span>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #333",
        padding: "12px",
        background: "#000",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          color: "#00ff41",
          fontSize: "12px",
          fontWeight: "bold",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          marginBottom: "8px",
        }}
      >
        SIMULATION_ENGINE // {type.toUpperCase()}
      </div>

      {hasError ? (
        <div
          style={{
            flex: 1,
            border: "1px solid #333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0a",
            height: "300px",
          }}
        >
          <svg width="100" height="150" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="50" y1="10" x2="50" y2="120" stroke="#00ff41" strokeWidth="2" />
            <circle cx="50" cy="10" r="4" fill="#333" />
            <circle cx="50" cy="120" r="15" fill="#fff" />
          </svg>
        </div>
      ) : (
        <div
          ref={containerRef}
          style={{
            width: "300px",
            height: "300px",
            border: "1px solid #1a1a1a",
            background: "#0a0a0a",
          }}
        />
      )}
    </div>
  );
}
