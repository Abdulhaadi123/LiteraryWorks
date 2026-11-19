"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { loadMotion, motionOn, ScrollTrigger } from "./loadMotion";
import {ArchitectureStatic} from "@/components/ArchitectureStatic";
import type {Stage} from "./stage";

type ModelScene={setProgress(p:number):void; render():void; labelAnchors:{key:string;position:import("three").Vector3}[];isLabelVisible?(key:string):boolean;dispose():void};
type SceneName="aiSystem";
const loaders={aiSystem:()=>import("./scenes/aiSystem")};
type StageProps={scene:SceneName;eyebrow:string;title:ReactNode;description:string;steps:{title:string;text:string}[];labels:{key:string;label:string;detail:string}[]};
export function Stage3D({scene,eyebrow,title,description,steps,labels}:StageProps) {
 const sectionRef=useRef<HTMLElement>(null),visualRef=useRef<HTMLDivElement>(null),canvasRef=useRef<HTMLCanvasElement>(null);
 const [progress,setProgress]=useState(0),[activeStep,setActiveStep]=useState(0);
 useEffect(()=>{
  const section=sectionRef.current,visual=visualRef.current,canvas=canvasRef.current;
  if(!section||!visual||!canvas||!motionOn())return;
  let stopped=false,ready=false,inView=false,raf=0,instance:Stage|null=null,currentScene:ModelScene|null=null,currentProgress=0;
  let observer:IntersectionObserver|null=null,preload:IntersectionObserver|null=null,resizeObserver:ResizeObserver|null=null,trigger:{kill():void}|null=null;
  const labelsMap=new Map(Array.from(visual.querySelectorAll<HTMLElement>("[data-model-label]")).map(node=>[node.dataset.modelLabel||"",node]));
  const lineMap=new Map(Array.from(visual.querySelectorAll<SVGPolylineElement>("[data-model-line]")).map(node=>[node.dataset.modelLine||"",node]));
  const dotMap=new Map(Array.from(visual.querySelectorAll<SVGCircleElement>("[data-model-dot]")).map(node=>[node.dataset.modelDot||"",node]));
  const repaint=()=>{
   if(!inView||!ready||!instance||!currentScene||stopped)return;
   currentScene.render();
   for(const anchor of currentScene.labelAnchors){
    const label=labelsMap.get(anchor.key),line=lineMap.get(anchor.key),dot=dotMap.get(anchor.key);
    if(!label||!line||!dot)continue;
    const point=instance.project(anchor.position);
    const visible=!point.behind&&(currentScene.isLabelVisible?.(anchor.key)??true);
    label.style.opacity=visible?"1":"0";line.style.opacity=visible?"1":"0";dot.style.opacity=visible?"1":"0";
    const x=label.offsetLeft-12, y=label.offsetTop+20;
    const mid=Math.min(x-16,point.x+38);
    line.setAttribute("points",`${point.x},${point.y} ${mid},${point.y} ${Math.max(mid,x-20)},${y} ${x},${y}`);
    dot.setAttribute("cx",String(point.x));dot.setAttribute("cy",String(point.y));
   }
   raf=window.requestAnimationFrame(repaint);
  };
  const build=async()=>{
   if(stopped||ready||!motionOn())return;
   try{
    await loadMotion();if(stopped||!motionOn())return;
    const [{createStage},mod]=await Promise.all([import("./stage"),loaders[scene]()]);
    if(stopped||!motionOn())return;
    instance=createStage(canvas);currentScene=mod.createScene(instance);
    const stage=instance,model=currentScene;
    const resize=()=>{const bounds=visual.getBoundingClientRect();stage.resize(bounds.width,bounds.height);stage.shift(bounds.width>650?.19:.1);model.setProgress(currentProgress);};
    resize();await stage.precompile();
    if(stopped){model.dispose();stage.dispose();instance=null;currentScene=null;return;}
    section.classList.add("xp-live");ready=true;
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(visual);
    observer=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??false;window.cancelAnimationFrame(raf);if(inView)raf=requestAnimationFrame(repaint);},{threshold:0});observer.observe(section);
    if(ScrollTrigger){trigger=ScrollTrigger.create({trigger:section,start:"top top+=76",end:"bottom bottom",scrub:1.5,onUpdate:self=>{currentProgress=self.progress;model.setProgress(currentProgress);setProgress(currentProgress);setActiveStep(Math.min(steps.length-1,Math.floor(currentProgress*steps.length)));}});ScrollTrigger.refresh();}
    model.setProgress(currentProgress);
   }catch(error){console.error("3D unavailable. Using accessible static architecture.",error);section.classList.add("xp-failed");}
  };
  const initiate=()=>{const schedule=(window as Window & {requestIdleCallback?:(callback:()=>void,options?:{timeout:number})=>number}).requestIdleCallback;if(schedule)schedule(()=>{if(!stopped)void build();},{timeout:850});else window.setTimeout(()=>{if(!stopped)void build();},120);};
  preload=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting){preload?.disconnect();initiate();}},{rootMargin:"150% 0px"});preload.observe(section);
  return()=>{stopped=true;cancelAnimationFrame(raf);preload?.disconnect();observer?.disconnect();resizeObserver?.disconnect();trigger?.kill();currentScene?.dispose();instance?.dispose();section.classList.remove("xp-live","xp-failed");};
 },[scene,steps.length]);
 return <section ref={sectionRef} className="experience-runway" style={{"--scene-vh":"330svh"} as CSSProperties} data-pace aria-label="Six layers of an intelligent technology architecture">
  <div className="experience-stage"><div className="container experience-grid">
   <div className="experience-copy"><p className="eyebrow"><span className="tiny-diamond"/>{eyebrow}</p><h2>{title}</h2><p className="experience-description">{description}</p><div className="experience-steps">{steps.map((step,i)=><div className={`experience-step ${i===activeStep?"step-active":""}`} key={step.title}><span className="step-num">0{i+1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}</div><div className="scene-progress" aria-hidden="true"><span style={{transform:`scaleX(${progress})`}}/></div><p className="experience-scroll-cue">SCROLL TO EXPLORE THE ARCHITECTURE <span aria-hidden="true">↓</span></p></div>
   <div className="scene-panel"><div className="stage-visual" ref={visualRef}><canvas ref={canvasRef} className="stage-canvas" aria-hidden="true"/><svg className="scene-leaders" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">{labels.map(label=><g key={label.key}><polyline data-model-line={label.key} points="" fill="none" stroke="currentColor" strokeWidth="1"/><circle data-model-dot={label.key} r="3.5" cx="0" cy="0" fill="currentColor"/></g>)}</svg>{labels.map((label,i)=><span key={label.key} data-model-label={label.key} className="model-label" style={{top:`${11+i*13.5}%`}}><small>{label.detail}</small><b>{label.label}</b></span>)}<span className="stage-caption">LW / REFERENCE ARCHITECTURE · INTERACTIVE MODEL</span></div></div>
   <div className="stage-static"><ArchitectureStatic/><div className="static-steps">{steps.map((s,i)=><article key={s.title}><span>0{i+1}</span><h3>{s.title}</h3><p>{s.text}</p></article>)}</div></div>
  </div></div>
 </section>;
}
