"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { loadMotion, motionOn, ScrollTrigger } from "./loadMotion";
import { ArchitectureStatic } from "@/components/ArchitectureStatic";
import type { Stage } from "./stage";

type ModelScene = {
  setProgress(p: number): void;
  render(): void;
  labelAnchors: { key: string; position: import("three").Vector3 }[];
  isLabelVisible?(key: string): boolean;
  dispose(): void;
};

type SceneName = "aiSystem";
const loaders = { aiSystem: () => import("./scenes/aiSystem") };

type StageProps = {
  scene: SceneName;
  eyebrow: string;
  title: ReactNode;
  description: string;
  steps: { title: string; text: string }[];
  labels: { key: string; label: string; detail: string; tag?: string }[];
};

export function Stage3D({ scene, eyebrow, title, description, steps, labels }: StageProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const visual = visualRef.current;
    const canvas = canvasRef.current;
    if (!section || !visual || !canvas || !motionOn()) return;

    let stopped = false;
    let ready = false;
    let inView = false;
    let raf = 0;
    let instance: Stage | null = null;
    let currentScene: ModelScene | null = null;
    let currentProgress = 0;
    let observer: IntersectionObserver | null = null;
    let preload: IntersectionObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let trigger: { kill(): void } | null = null;

    const labelsMap = new Map(
      Array.from(visual.querySelectorAll<HTMLElement>("[data-model-label]")).map((node) => [
        node.dataset.modelLabel || "",
        node,
      ])
    );
    const lineMap = new Map(
      Array.from(visual.querySelectorAll<SVGPolylineElement>("[data-model-line]")).map((node) => [
        node.dataset.modelLine || "",
        node,
      ])
    );
    const dotMap = new Map(
      Array.from(visual.querySelectorAll<SVGCircleElement>("[data-model-dot]")).map((node) => [
        node.dataset.modelDot || "",
        node,
      ])
    );

    const repaint = () => {
      if (!inView || !ready || !instance || !currentScene || stopped) return;
      currentScene.render();

      for (const anchor of currentScene.labelAnchors) {
        const label = labelsMap.get(anchor.key);
        const line = lineMap.get(anchor.key);
        const dot = dotMap.get(anchor.key);
        if (!label || !line || !dot) continue;

        const point = instance.project(anchor.position);
        const isVisible = !point.behind && (currentScene.isLabelVisible?.(anchor.key) ?? true);

        label.style.opacity = isVisible ? "1" : "0";
        label.style.transform = isVisible ? "translateX(0)" : "translateX(16px)";
        line.style.opacity = isVisible ? "1" : "0";
        dot.style.opacity = isVisible ? "1" : "0";

        const x = label.offsetLeft - 12;
        const y = label.offsetTop + 20;
        const mid = Math.min(x - 16, point.x + 38);

        line.setAttribute(
          "points",
          `${point.x},${point.y} ${mid},${point.y} ${Math.max(mid, x - 20)},${y} ${x},${y}`
        );
        dot.setAttribute("cx", String(point.x));
        dot.setAttribute("cy", String(point.y));
      }

      raf = window.requestAnimationFrame(repaint);
    };

    const build = async () => {
      if (stopped || ready || !motionOn()) return;
      try {
        await loadMotion();
        if (stopped || !motionOn()) return;

        const [{ createStage }, mod] = await Promise.all([
          import("./stage"),
          loaders[scene](),
        ]);
        if (stopped || !motionOn()) return;

        instance = createStage(canvas);
        currentScene = mod.createScene(instance);
        const stage = instance;
        const model = currentScene;

        const resize = () => {
          const bounds = visual.getBoundingClientRect();
          stage.resize(bounds.width, bounds.height);
          stage.shift(bounds.width > 650 ? 0.18 : 0.08);
          model.setProgress(currentProgress);
        };

        resize();
        await stage.precompile();
        if (stopped) {
          model.dispose();
          stage.dispose();
          instance = null;
          currentScene = null;
          return;
        }

        section.classList.add("xp-live");
        ready = true;

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(visual);

        observer = new IntersectionObserver(
          (entries) => {
            inView = entries[0]?.isIntersecting ?? false;
            window.cancelAnimationFrame(raf);
            if (inView) raf = requestAnimationFrame(repaint);
          },
          { threshold: 0 }
        );
        observer.observe(section);

        if (ScrollTrigger) {
          trigger = ScrollTrigger.create({
            trigger: section,
            start: "top top+=76",
            end: "bottom bottom",
            scrub: 1.5,
            onUpdate: (self) => {
              currentProgress = self.progress;
              model.setProgress(currentProgress);
              setProgress(currentProgress);
              setActiveStep(Math.min(steps.length - 1, Math.floor(currentProgress * steps.length)));
            },
          });
          ScrollTrigger.refresh();
        }

        model.setProgress(currentProgress);
      } catch (error) {
        console.error("3D unavailable. Using accessible static architecture.", error);
        section.classList.add("xp-failed");
      }
    };

    const initiate = () => {
      const schedule = (
        window as Window & {
          requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
        }
      ).requestIdleCallback;
      if (schedule) schedule(() => { if (!stopped) void build(); }, { timeout: 850 });
      else window.setTimeout(() => { if (!stopped) void build(); }, 120);
    };

    preload = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          preload?.disconnect();
          initiate();
        }
      },
      { rootMargin: "150% 0px" }
    );
    preload.observe(section);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      preload?.disconnect();
      observer?.disconnect();
      resizeObserver?.disconnect();
      trigger?.kill();
      currentScene?.dispose();
      instance?.dispose();
      section.classList.remove("xp-live", "xp-failed");
    };
  }, [scene, steps.length]);

  return (
    <section
      ref={sectionRef}
      className="experience-runway"
      style={{ "--scene-vh": "340svh" } as CSSProperties}
      data-pace
      aria-label="Interactive 3D Architectural Digital Twin and AI Systems Tower"
    >
      <div className="experience-stage">
        <div className="container experience-grid">
          <div className="experience-copy">
            <div className="telemetry-pill">
              <span className="telemetry-live-dot" />
              <span>LIVE 3D DIGITAL TWIN · EXPLODED CAD VIEW</span>
            </div>
            <p className="eyebrow">
              <span className="tiny-diamond" />
              {eyebrow}
            </p>
            <h2>{title}</h2>
            <p className="experience-description">{description}</p>

            <div className="experience-steps">
              {steps.map((step, i) => (
                <div
                  className={`experience-step ${i === activeStep ? "step-active" : ""}`}
                  key={step.title}
                >
                  <div className="step-num-badge">0{i + 1}</div>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="scene-progress-container">
              <div className="scene-progress" aria-hidden="true">
                <span style={{ transform: `scaleX(${progress})` }} />
              </div>
              <div className="progress-labels">
                <span>01 Substructure</span>
                <span>03 Infrastructure</span>
                <span>06 Governance</span>
              </div>
            </div>

            <p className="experience-scroll-cue">
              SCROLL TO INSPECT ARCHITECTURAL SUBSYSTEMS <span aria-hidden="true">↓</span>
            </p>
          </div>

          <div className="scene-panel">
            <div className="stage-visual" ref={visualRef}>
              <canvas ref={canvasRef} className="stage-canvas" aria-hidden="true" />
              <svg className="scene-leaders" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                {labels.map((label) => (
                  <g key={label.key}>
                    <polyline
                      data-model-line={label.key}
                      points=""
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="1.2"
                      strokeDasharray="4 2"
                    />
                    <circle data-model-dot={label.key} r="4" cx="0" cy="0" fill="#00f0ff" />
                  </g>
                ))}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ff6b00" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
              </svg>

              {labels.map((label, i) => (
                <div
                  key={label.key}
                  data-model-label={label.key}
                  className="model-label"
                  style={{ top: `${8 + i * 14.5}%` }}
                >
                  <div className="model-label-card">
                    <div className="model-label-top">
                      <span className="model-label-serial">{label.detail}</span>
                      <span className="model-label-dot" />
                    </div>
                    <b>{label.label}</b>
                  </div>
                </div>
              ))}

              <div className="stage-hud-meta">
                <span>SYSTEM ID: LW-TWIN-2026</span>
                <span>STATUS: ACTIVE SCRUB</span>
                <span>BIM / AI LAYER: SYNCHRONIZED</span>
              </div>
            </div>
          </div>

          <div className="stage-static">
            <ArchitectureStatic />
            <div className="static-steps">
              {steps.map((s, i) => (
                <article key={s.title}>
                  <span>0{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
