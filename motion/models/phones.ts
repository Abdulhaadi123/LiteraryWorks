import * as THREE from "three";
import { lerp, smooth } from "../engine";
import { makePhone, SCREEN_PX } from "../devices";
import { cyl, mat, put, screenFader, shadow, standFor } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * AI mobile apps: three of our apps on three phones standing on a round white podium. The phones fan out from a stack
 * as the page scrolls, and each one moves on to a second screen of its app.
 */
const APPS = [
  ["phone-civilchat", "phone-civilfeed"],
  ["phone-beanstalk", "phone-faith1"],
  ["phone-faith2", "phone-faith3"],
];

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const k = mini ? 0.62 : 1;
  const sets = await Promise.all(APPS.map((names) => Promise.all(names.map((n) => env.shot(n, Math.round(SCREEN_PX.phone[0] * k), Math.round(SCREEN_PX.phone[1] * k))))));

  // the podium: a low round plinth with a thin green edge
  put(group, cyl(2.9, 3.0, 0.3, 80), mat.white(0.3), 0, 0.15, 0);
  put(group, cyl(2.91, 2.91, 0.03, 80), new THREE.MeshBasicMaterial({ color: 0x73c94a, toneMapped: false }), 0, 0.28, 0);
  group.add(shadow(env, 8, 6.2, 0.28, 0, 0.1));

  const phones = sets.map((tex, i) => {
    const dev = makePhone(tex[0]);
    env.textures.push(...dev.textures);
    const holder = standFor(dev, 0.16);
    holder.scale.setScalar(1.75);
    const g = new THREE.Group();
    g.position.y = 0.3;
    g.add(holder);
    group.add(g);
    return { dev, g, fade: screenFader(dev.screen!, tex, [0.5 + i * 0.1]) };
  });

  const model: Model = {
    group,
    tags: [phones[1].dev.tagObj],
    camera: { az: [-0.26, 0.2], elev: [0.3, 0.24] },
    floorY: 0,
    set(_a, _l, p) {
      const fan = smooth(Math.min(1, p / 0.5));
      phones.forEach((ph, i) => {
        const s = i - 1;
        const spread = lerp(0.55, 1, fan);
        ph.g.position.set(s * 2.0 * spread, 0.3, Math.abs(s) * 0.5 - 0.1 + (1 - fan) * (s === 0 ? 0.5 : 0));
        ph.g.rotation.y = -s * lerp(0.1, 0.34, fan);
        ph.fade(p);
      });
      group.updateMatrixWorld(true);
    },
    frame: () => ({ cx: 0, cy: 1.8, hw: 3.8, hh: 2.4 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
