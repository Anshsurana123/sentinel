"use client";

import React, { useEffect, useRef, useState } from "react";

interface Props {
  type: "pendulum" | "spring" | "projectile" | "none";
  paramValue: number; // e.g., amplitude, length, stiffness
}

export default function PendulumSim({ type, paramValue }: Props) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<any>(null);
  const renderRef = useRef<any>(null);
  const runnerRef = useRef<any>(null);
  const objectRef = useRef<any>(null);

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (type === "none" || !sceneRef.current) return;

    let isMounted = true;

    const initMatter = async () => {
      try {
        const Matter = (await import("matter-js")).default;
        if (!isMounted) return;

        const { Engine, Render, Runner, World, Bodies, Constraint, Composite } = Matter;

        const width = sceneRef.current!.clientWidth || 400;
        const height = sceneRef.current!.clientHeight || 300;

        const engine = Engine.create();
        const render = Render.create({
          element: sceneRef.current!,
          engine: engine,
          options: {
            width,
            height,
            background: "#0a0a0a",
            wireframes: false,
          },
        });

        // Clear world
        World.clear(engine.world, false);

        const cx = width / 2;
        const cy = 50;

        if (type === "pendulum") {
          // Pendulum length scales with paramValue (e.g. 50 to 200)
          const length = 50 + paramValue * 15;
          const anchor = Bodies.circle(cx, cy, 5, { isStatic: true, render: { fillStyle: "#333" } });
          const bob = Bodies.circle(cx + length * 0.8, cy + length * 0.6, 20, { 
            frictionAir: 0.001,
            restitution: 0.9,
            render: { fillStyle: "#ffffff" }
          });
          
          objectRef.current = bob;

          const constraint = Constraint.create({
            pointA: { x: cx, y: cy },
            bodyB: bob,
            length: length,
            stiffness: 0.9,
            render: { strokeStyle: "#00ff41", lineWidth: 2 }
          });

          World.add(engine.world, [anchor, bob, constraint]);

        } else if (type === "spring") {
          // Spring stiffness scales with paramValue (1 to 10 mapped to 0.01 to 0.1)
          const stiffness = 0.01 + (paramValue / 10) * 0.09;
          const anchor = Bodies.rectangle(cx, cy, 100, 10, { isStatic: true, render: { fillStyle: "#333" } });
          const mass = Bodies.rectangle(cx, cy + 150, 40, 40, { 
            frictionAir: 0.05,
            render: { fillStyle: "#ffffff" }
          });

          objectRef.current = mass;

          const spring = Constraint.create({
            pointA: { x: cx, y: cy },
            bodyB: mass,
            length: 100,
            stiffness: stiffness,
            damping: 0.02,
            render: { strokeStyle: "#00ff41", lineWidth: 2, type: "spring" as any }
          });

          World.add(engine.world, [anchor, mass, spring]);
          
          // Initial pull
          Matter.Body.setPosition(mass, { x: cx, y: cy + 250 });

        } else if (type === "projectile") {
          // Cannon velocity scales with paramValue
          const ground = Bodies.rectangle(cx, height - 10, width, 20, { isStatic: true, render: { fillStyle: "#333" } });
          const ball = Bodies.circle(20, height - 30, 15, {
            restitution: 0.6,
            frictionAir: 0.01,
            render: { fillStyle: "#ffffff" }
          });
          
          objectRef.current = ball;

          World.add(engine.world, [ground, ball]);
          
          // Apply initial force
          const force = paramValue * 0.01;
          Matter.Body.applyForce(ball, ball.position, { x: force, y: -force });
          
          // Reset interval for continuous projectile simulation
          const resetInterval = setInterval(() => {
            if (!isMounted) return;
            Matter.Body.setPosition(ball, { x: 20, y: height - 30 });
            Matter.Body.setVelocity(ball, { x: 0, y: 0 });
            Matter.Body.applyForce(ball, ball.position, { x: paramValue * 0.01, y: -paramValue * 0.01 });
          }, 3000);
          
          (engine as any)._resetInterval = resetInterval;
        }

        Render.run(render);
        const runner = Runner.create();
        Runner.run(runner, engine);

        engineRef.current = engine;
        renderRef.current = render;
        runnerRef.current = runner;
      } catch (err) {
        console.error("Failed to load matter-js", err);
        if (isMounted) setHasError(true);
      }
    };

    initMatter();

    return () => {
      isMounted = false;
      if (engineRef.current) {
        if (engineRef.current._resetInterval) clearInterval(engineRef.current._resetInterval);
        const Matter = (window as any).Matter; // Since we dynamically imported it, it might not be globally available cleanly, but World is inside engine
        if (renderRef.current) {
          renderRef.current.canvas.remove();
          renderRef.current.canvas = null;
          renderRef.current.context = null;
          renderRef.current.textures = {};
        }
      }
    };
  }, [type, paramValue]);

  if (type === "none") {
    return (
      <div className="border border-[#333] p-6 h-full flex flex-col justify-center items-center text-gray-600 font-mono">
        <span className="opacity-50">NO_SIMULATION_REQUIRED //</span>
      </div>
    );
  }

  return (
    <div className="border border-[#333] p-6 bg-black flex flex-col gap-4 font-mono h-full">
      <div className="text-[#00ff41] text-xs font-bold uppercase tracking-widest">
        SIMULATION ENGINE // {type.toUpperCase()}
      </div>

      {hasError ? (
        <div className="flex-1 border border-[#333] flex items-center justify-center relative bg-[#0a0a0a]">
          <svg width="100" height="150" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="50" y1="10" x2="50" y2="120" stroke="#00ff41" strokeWidth="2" />
            <circle cx="50" cy="10" r="4" fill="#333" />
            <circle cx="50" cy="120" r="15" fill="#fff" />
          </svg>
        </div>
      ) : (
        <div 
          ref={sceneRef} 
          className="flex-1 w-full border border-[#333] bg-[#0a0a0a] min-h-[250px] relative overflow-hidden" 
        />
      )}
    </div>
  );
}
