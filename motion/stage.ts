import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { blobTexture, canvasTexture } from "./kit";
import type { GL } from "./gl";

/**
 * What makes a scene in the light studio feel like a place and not a diagram: a glossy floor that mirrors what stands
 * on it (and fades with distance), a faint perspective grid, a soft shadow pool, two coloured rim lights that catch
 * the edges of the chrome and glass, and soft out-of-focus colour drifting at different depths. Everything here
 * lives on layer 1 except the floor and the lights, so the mirror shows the model and not the dust.
 */

export interface Dressing {
  /** Where the model stands now (after the camera is placed): the floor level, the middle of its box, how wide it is, the scroll and how much it is running. */
  update(s: { floorY: number; cx: number; hw: number; p: number; l: number; k?: number }): void;
  /** The drawing size changed (CSS pixels). */
  resize(w: number, h: number): void;
  dispose(): void;
}

const FLOOR_SHADER = {
  name: "StageFloor",
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uStrength: { value: 0.32 },
    uCenter: { value: new THREE.Vector2() },
    uRadius: { value: 12 },
    uContactY: { value: 0 },
    uFadePx: { value: 300 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() {
      vUv = textureMatrix * vec4( position, 1.0 );
      vec4 w = modelMatrix * vec4( position, 1.0 );
      vWorld = w.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      #include <logdepthbuf_vertex>
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    uniform vec2 uCenter;
    uniform float uRadius;
    uniform float uContactY;
    uniform float uFadePx;
    varying vec4 vUv;
    varying vec3 vWorld;
    #include <logdepthbuf_pars_fragment>
    void main() {
      #include <logdepthbuf_fragment>
      vec4 refl = texture2DProj( tDiffuse, vUv );
      // the floor fades away from the model, round it
      float d = length( vWorld.xz - uCenter );
      float vignette = 1.0 - smoothstep( uRadius * 0.4, uRadius, d );
      // and the reflection is strongest at the foot of what stands there, and fades as it goes down the screen
      float below = max( uContactY - gl_FragCoord.y, 0.0 );
      float fade = 1.0 - smoothstep( 0.0, uFadePx, below );
      float a = refl.a * uStrength * vignette * fade;
      gl_FragColor = vec4( refl.rgb, a );
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

const frac = (x: number) => x - Math.floor(x);

export function dressStage(gl: GL, scene: THREE.Scene, camera: THREE.PerspectiveCamera, textures: THREE.Texture[]): Dressing {
  const objects: THREE.Object3D[] = [];
  const keep = <T extends THREE.Object3D>(o: T): T => {
    scene.add(o);
    objects.push(o);
    return o;
  };
  camera.layers.enable(1);

  /* ---- the glossy floor ---- */
  const floor = new Reflector(new THREE.PlaneGeometry(90, 90), { textureWidth: 512, textureHeight: 512, clipBias: 0.003, multisample: 2, shader: FLOOR_SHADER });
  floor.rotation.x = -Math.PI / 2;
  floor.renderOrder = -2;
  const fm = floor.material as THREE.ShaderMaterial;
  fm.transparent = true;
  fm.depthWrite = false;
  // the mirror shows the model, not the dust and the lights: the reflection camera sees layer 0 only
  const baseReflectionCamera = floor.getReflectionCamera;
  floor.getReflectionCamera = (cam: THREE.Camera) => {
    const c = baseReflectionCamera.call(floor, cam) as THREE.Camera;
    c.layers.set(0);
    return c;
  };
  keep(floor);

  /* ---- a faint perspective grid, fading out with distance ---- */
  const cell = canvasTexture(
    64,
    64,
    (g, w, h) => {
      g.fillStyle = "rgba(34,66,95,0.9)";
      g.fillRect(0, 0, w, 2);
      g.fillRect(0, 0, 2, h);
    },
    8,
  );
  cell.wrapS = cell.wrapT = THREE.RepeatWrapping;
  cell.repeat.set(44, 44);
  const fadeTex = canvasTexture(
    256,
    256,
    (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, "rgba(255,255,255,1)");
      gr.addColorStop(0.3, "rgba(255,255,255,0.45)");
      gr.addColorStop(0.62, "rgba(255,255,255,0.1)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    },
    1,
  );
  textures.push(cell, fadeTex);
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), new THREE.MeshBasicMaterial({ map: cell, alphaMap: fadeTex, transparent: true, opacity: 0.1, depthWrite: false, toneMapped: false }));
  grid.rotation.x = -Math.PI / 2;
  grid.layers.set(1);
  keep(grid);

  /* ---- a fine instrument ring on the floor under the model: thin circles, ticks and a few lit arcs, turning slowly with the scroll ---- */
  const ringTex = canvasTexture(
    1024,
    1024,
    (g, w, h) => {
      const c = w / 2;
      g.translate(c, c);
      const circle = (r: number, lw: number, color: string, dash?: number[]) => {
        g.beginPath();
        g.setLineDash(dash ?? []);
        g.lineWidth = lw;
        g.strokeStyle = color;
        g.arc(0, 0, r, 0, Math.PI * 2);
        g.stroke();
      };
      circle(c * 0.97, 3, "rgba(34,66,95,0.5)");
      circle(c * 0.8, 2, "rgba(34,66,95,0.3)", [2, 14]);
      circle(c * 0.66, 2, "rgba(34,66,95,0.38)");
      // ticks between the two outer circles
      g.setLineDash([]);
      g.strokeStyle = "rgba(34,66,95,0.5)";
      g.lineWidth = 2;
      for (let i = 0; i < 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const r0 = c * 0.9;
        const r1 = c * (i % 5 === 0 ? 0.84 : 0.875);
        g.beginPath();
        g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
        g.stroke();
      }
      // a few lit arcs, in the brand's green
      g.lineCap = "round";
      g.strokeStyle = "rgba(93,181,54,0.95)";
      g.lineWidth = 7;
      [
        [0.15, 0.42],
        [2.6, 2.9],
        [4.4, 4.95],
      ].forEach(([a0, a1]) => {
        g.beginPath();
        g.arc(0, 0, c * 0.97, a0, a1);
        g.stroke();
      });
      g.strokeStyle = "rgba(47,111,181,0.9)";
      g.lineWidth = 5;
      [
        [1.3, 1.6],
        [3.7, 4.05],
      ].forEach(([a0, a1]) => {
        g.beginPath();
        g.arc(0, 0, c * 0.66, a0, a1);
        g.stroke();
      });
    },
    8,
  );
  textures.push(ringTex);
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.layers.set(1);
  keep(ring);

  /* ---- a pool of light under the model ---- */
  const poolTex = blobTexture("34,66,95", 0.5);
  textures.push(poolTex);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, opacity: 0.14, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.layers.set(1);
  keep(pool);

  /* ---- the rim lights: green from behind on the left, blue from behind on the right, and a soft fill from above ---- */
  const rimG = new THREE.PointLight(0x84e255, 110, 70, 2);
  const rimB = new THREE.PointLight(0x4f9bff, 150, 70, 2);
  const fill = new THREE.PointLight(0xdbe9ff, 90, 70, 2);
  keep(rimG);
  keep(rimB);
  keep(fill);

  /* ---- soft lights out of focus, in front of and behind the model ---- */
  const bokehTex = blobTexture("150,205,255", 0.9);
  textures.push(bokehTex);
  const tints = [0x6fb0ff, 0x73c94a, 0x8fd2ff, 0x4f8fe0, 0xa5e48a];
  const bokeh = Array.from({ length: 18 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bokehTex, color: tints[i % tints.length], transparent: true, depthWrite: false, opacity: 0.015 + frac(i * 0.37) * 0.035, toneMapped: false }));
    const size = 0.8 + frac(i * 0.41) * 2.8;
    s.scale.set(size, size, 1);
    s.layers.set(1);
    s.userData = { ox: (frac(i * 0.618) - 0.5) * 24, oy: 0.4 + frac(i * 0.7548) * 8.5, oz: -10 + frac(i * 0.3247) * 16, ph: i * 1.7 };
    keep(s);
    return s;
  });

  const v = new THREE.Vector3();
  const u = fm.uniforms;
  return {
    update({ floorY, cx, hw, p, l, k = 1 }) {
      floor.position.set(cx, floorY, 0);
      grid.position.set(cx, floorY + 0.004, 0);
      pool.position.set(cx, floorY + 0.006, 0);
      pool.scale.set(hw * 2.6, hw * 1.5, 1);
      ring.position.set(cx, floorY + 0.008, 0);
      const rs = Math.max(hw * 2.1, 7);
      ring.scale.set(rs, rs, 1);
      ring.rotation.z = p * 1.4;
      (ring.material as THREE.MeshBasicMaterial).opacity = (0.34 + 0.24 * l) * k;
      (grid.material as THREE.MeshBasicMaterial).opacity = 0.1 * k;
      u.uStrength.value = 0.32 * k;
      (pool.material as THREE.MeshBasicMaterial).opacity = (0.12 + 0.08 * l) * k;
      rimG.position.set(cx - 9, floorY + 4.5, -5);
      rimB.position.set(cx + 9.5, floorY + 5.5, -4);
      fill.position.set(cx, floorY + 11, 9);
      bokeh.forEach((s) => {
        const d = s.userData as { ox: number; oy: number; oz: number; ph: number };
        s.position.set(cx + d.ox + Math.sin(p * 6.28 * 1.3 + d.ph) * 0.5, floorY + d.oy + Math.cos(p * 6.28 * 1.1 + d.ph) * 0.35, d.oz);
      });
      // the mirror: where the foot of the model is on the screen, so the reflection fades below it
      v.set(cx, floorY, hw * 0.5).project(camera);
      const bufferH = gl.size.h * gl.ratio;
      u.uContactY.value = (v.y * 0.5 + 0.5) * bufferH;
      u.uFadePx.value = 0.3 * bufferH;
      u.uCenter.value.set(cx, 0);
      u.uRadius.value = Math.max(hw * 2.6, 9);
    },
    resize(w, h) {
      const rt = floor.getRenderTarget();
      const k = 0.6 * gl.ratio;
      rt.setSize(Math.max(64, Math.min(1400, Math.round(w * k))), Math.max(64, Math.min(1400, Math.round(h * k))));
    },
    dispose() {
      floor.dispose();
      objects.forEach((o) => {
        scene.remove(o);
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | undefined;
        mat?.dispose();
      });
    },
  };
}
