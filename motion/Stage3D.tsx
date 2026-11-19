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
        label.style.transform = isVisible ? "translateX(0)" : "translateX(12px)";
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
      className="experience-runway bg-[#f8fafc] border-t border-b border-slate-200"
      style={{ "--scene-vh": "340svh" } as CSSProperties}
      data-pace
      aria-label="Interactive 3D Architectural Systems Model"
    >
      <div className="experience-stage">
        <div className="experience-grid mx-auto grid min-h-[860px] max-w-[1400px] grid-cols-1 items-center gap-8 px-6 py-20 lg:grid-cols-[minmax(360px,0.4fr)_minmax(0,0.6fr)] lg:gap-12 lg:px-8">
          <div className="relative z-10 py-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
              <span>ARCHITECTURAL SCALE MODEL · EXPLODED VIEW</span>
            </div>

            <p className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              <span className="h-1.5 w-1.5 rotate-45 bg-[#c29b61]" />
              {eyebrow}
            </p>

            <h2 className="mt-3 mb-5 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {title}
            </h2>

            <p className="mb-8 max-w-lg text-base leading-relaxed text-slate-600">
              {description}
            </p>

            <div className="border-t border-slate-200">
              {steps.map((step, i) => (
                <div
                  className={`flex gap-4 border-b border-slate-200 py-4 transition-opacity duration-300 ${
                    i === activeStep ? "opacity-100" : "opacity-40"
                  }`}
                  key={step.title}
                >
                  <div className="font-mono text-xs font-bold text-[#b48d55]">0{i + 1}</div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="h-1 w-full bg-slate-200 overflow-hidden rounded-full" aria-hidden="true">
                <span
                  className="block h-full origin-left bg-[#0f2438] rounded-full transition-transform"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] text-slate-500">
                <span>01 Substructure</span>
                <span>03 Infrastructure</span>
                <span>06 Governance</span>
              </div>
            </div>

            <p className="mt-6 font-mono text-[11px] tracking-wider text-slate-600">
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
                      stroke="#94a3b8"
                      strokeWidth="1.2"
                    />
                    <circle data-model-dot={label.key} r="3.5" cx="0" cy="0" fill="#0f2438" />
                  </g>
                ))}
              </svg>

              {labels.map((label, i) => (
                <div
                  key={label.key}
                  data-model-label={label.key}
                  className="model-label"
                  style={{ top: `${8 + i * 14.5}%` }}
                >
                  <div className="rounded-lg border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur-sm">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-[10px] font-semibold tracking-wider text-slate-500">{label.detail}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c29b61]" />
                    </div>
                    <b className="block text-xs font-bold text-slate-900">{label.label}</b>
                  </div>
                </div>
              ))}

              <div className="absolute bottom-3 left-3 z-10 flex gap-4 font-mono text-[10px] tracking-wider text-slate-500">
                <span>MODEL ID: LW-STUDY-06</span>
                <span>STATUS: ARCHITECTURAL EXPLODED VIEW</span>
              </div>
            </div>
          </div>

          <div className="stage-static">
            <ArchitectureStatic />
          </div>
        </div>
      </div>
    </section>
  );
}
