import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import type { GL } from "./gl";

/**
 * A plain photo studio under every scene: a glossy white floor that mirrors what stands on it (and fades with
 * distance), and three soft lights that give the edges of metal and glass a clean highlight. Nothing else: no grids,
 * rings, dust or glow. Everything that casts a shadow draws its own (models/real.ts), on layer 1, so the mirror shows
 * the objects and not their shadows.
 */

export interface Dressing {
  /** Where the model stands now (after the camera is placed): the floor level, the middle of its box, how wide it is, and how much of the mirror to show. */
  update(s: { floorY: number; cx: number; hw: number; p?: number; l?: number; k?: number }): void;
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
    uStrength: { value: 0.22 },
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

export function dressStage(gl: GL, scene: THREE.Scene, camera: THREE.PerspectiveCamera, _textures?: THREE.Texture[]): Dressing {
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
  // the mirror shows the objects, not their shadows: the reflection camera sees layer 0 only
  const baseReflectionCamera = floor.getReflectionCamera;
  floor.getReflectionCamera = (cam: THREE.Camera) => {
    const c = baseReflectionCamera.call(floor, cam) as THREE.Camera;
    c.layers.set(0);
    return c;
  };
  keep(floor);

  /* ---- three soft lights: a warm key from the front left, a cool rim from behind on the right, a fill from above ---- */
  const key = keep(new THREE.PointLight(0xfff3e4, 70, 80, 2));
  const rim = keep(new THREE.PointLight(0xdde9ff, 90, 80, 2));
  const fill = keep(new THREE.PointLight(0xffffff, 45, 80, 2));

  const v = new THREE.Vector3();
  const u = fm.uniforms;
  return {
    update({ floorY, cx, hw, k = 1 }) {
      floor.position.set(cx, floorY, 0);
      u.uStrength.value = 0.22 * k;
      key.position.set(cx - 8, floorY + 9, 9);
      rim.position.set(cx + 9, floorY + 6, -7);
      fill.position.set(cx, floorY + 12, 4);
      // the mirror: where the foot of the model is on the screen, so the reflection fades below it
      v.set(cx, floorY, hw * 0.5).project(camera);
      const bufferH = gl.size.h * gl.ratio;
      u.uContactY.value = (v.y * 0.5 + 0.5) * bufferH;
      u.uFadePx.value = 0.26 * bufferH;
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
      objects.forEach((o) => scene.remove(o));
    },
  };
}
