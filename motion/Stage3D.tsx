"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { loadMotion, motionOn, ScrollTrigger } from "./loadMotion";
import type { Stage } from "./stage";

type ModelScene = {
  setProgress(p: number): void;
  render(): void;
  labelAnchors: {key: string; position: import("three").Vector3}[];
  isLabelVisible?(key: string): boolean;
  dispose(): void;
};
type SceneName = "aiSystem";
const loaders = { aiSystem: () => import("./scenes/aiSystem") };

type StageProps = {scene: SceneName; eyebrow: string; title: ReactNode; description: string; steps: {title: string; text: string}[]; labels: {key: string; label: string; detail: string}[]};

export function Stage3D({scene, eyebrow, title, description, steps, labels}: StageProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const section = sectionRef.current, visual = visualRef.current, canvas = canvasRef.current;
    if (!section || !visual || !canvas || !motionOn()) return;
    let stopped = false, ready = false, inView = false, raf = 0, instance: Stage | null = null, currentScene: ModelScene | null = null;
    let observer: IntersectionObserver | null = null, preload: IntersectionObserver | null = null, trigger: {kill(): void} | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let currentProgress = 0;
    const labelNodes = new Map(Array.from(visual.querySelectorAll<HTMLElement>("[data-model-label]")).map(node => [node.dataset.modelLabel || "", node]));
    const repaint = () => {
      if (!inView || !ready || !instance || !currentScene || stopped) return;
      currentScene.render();
      for (const anchor of currentScene.labelAnchors) {
        const element = labelNodes.get(anchor.key);
        if (!element) continue;
        const point = instance.project(anchor.position);
        const visible = !point.behind && (currentScene.isLabelVisible?.(anchor.key) ?? true);
        element.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
        element.style.opacity = visible ? "1" : "0";
      }
      raf = window.requestAnimationFrame(repaint);
    };
    const build = async () => {
      if (stopped || ready || !motionOn()) return;
      try {
        await loadMotion();
        if (stopped || !motionOn()) return;
        const [{createStage}, mod] = await Promise.all([import("./stage"), loaders[scene]()]);
        if (stopped || !motionOn()) return;
        instance = createStage(canvas);
        currentScene = mod.createScene(instance);
        const stage = instance;
        const model = currentScene;
        const resize = () => {
          const bounds = visual.getBoundingClientRect();
          stage.resize(bounds.width, bounds.height);
          stage.shift(bounds.width > 950 ? 0.16 : 0);
          model.setProgress(currentProgress);
        };
        resize();
        await stage.precompile(); // precompile shaders before first painted frame
        if (stopped) {model.dispose();stage.dispose();instance=null;currentScene=null; return;}
        section.classList.add("xp-live");
        ready = true;
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(visual);
        observer = new IntersectionObserver(entries => {
          inView = entries[0]?.isIntersecting ?? false;
          window.cancelAnimationFrame(raf);
          if (inView) raf = window.requestAnimationFrame(repaint);
        }, {threshold: 0});
        observer.observe(section);
        if (ScrollTrigger) {
          trigger = ScrollTrigger.create({
            trigger: section, start: "top top+=80", end: "bottom bottom", scrub: 1.5,
            onUpdate: self => {
              currentProgress = self.progress;
              model.setProgress(currentProgress);
              setProgress(currentProgress);
              setActiveStep(Math.min(steps.length - 1, Math.floor(currentProgress * steps.length)));
            }
          });
          ScrollTrigger.refresh();
        }
        model.setProgress(currentProgress);
      } catch (error) {
        console.error("3D scene unavailable; displaying the static alternative.", error);
        section.classList.add("xp-failed");
      }
    };
    const initiate = () => {
      const schedule = (window as Window & {requestIdleCallback?: (cb: () => void, options?: {timeout: number}) => number}).requestIdleCallback;
      if (schedule) schedule(() => {if (!stopped) void build();}, {timeout: 900});
      else window.setTimeout(() => {if (!stopped) void build();}, 120);
    };
    preload = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) {preload?.disconnect(); initiate();}
    }, {rootMargin: "150% 0px"});
    preload.observe(section);
    return () => {
      stopped = true; window.cancelAnimationFrame(raf);
      preload?.disconnect(); observer?.disconnect();resizeObserver?.disconnect();trigger?.kill();
      currentScene?.dispose(); instance?.dispose();
      section.classList.remove("xp-live", "xp-failed");
    };
  }, [scene, steps.length]);

  return <section ref={sectionRef} className="experience-runway" style={{"--scene-vh": "330svh"} as CSSProperties} aria-label="Interactive demonstration of an intelligent platform">
    <div className="experience-stage">
      <div className="container experience-grid">
        <div className="experience-copy"><p className="eyebrow gold-text"><span className="tiny-diamond"/>{eyebrow}</p><h2>{title}</h2><p className="experience-description">{description}</p>
          <div className="experience-steps">{steps.map((step, i) => <div key={step.title} className={`experience-step ${i === activeStep ? "step-active" : ""}`}><span className="step-num">0{i + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}</div>
          <div className="scene-progress" aria-hidden="true"><span style={{transform: `scaleX(${progress})`}}/></div>
        </div>
        <div className="scene-panel"><div ref={visualRef} className="stage-visual"><canvas ref={canvasRef} className="stage-canvas" aria-hidden="true"/>{labels.map(label => <span data-model-label={label.key} className="model-label" key={label.key}><b>{label.label}</b><small>{label.detail}</small></span>)}<div className="stage-crosshair crosshair-one"/><div className="stage-crosshair crosshair-two"/><span className="stage-caption">SCROLL / REVEAL THE SYSTEM</span></div></div>
        <div className="stage-static"><div className="static-diagram" aria-hidden="true"><span className="static-center">AI</span><span>DATA</span><span>WORKFLOW</span><span>PEOPLE</span></div><div className="static-steps">{steps.map((step, i) => <article key={step.title}><span>0{i+1}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div>
      </div>
    </div>
  </section>;
}
