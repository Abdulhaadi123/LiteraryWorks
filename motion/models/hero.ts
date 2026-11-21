import * as THREE from "three";
import { clamp01, smooth } from "../engine";
import { makeLaptop, makePhone, makeTablet, SCREEN_PX } from "../devices";
import { screenFader, shadow, standFor } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * The home page: our work on the devices it runs on. A laptop with a web platform, a tablet with an assistant and a
 * phone with an app stand together on one floor, and as the story goes from discovery to running it, the projects on
 * their screens move on (the same moments as the copy: 0.31, 0.49, 0.69, 0.88). The camera drifts round them.
 */
const build: ModelBuilder = async (env, mini) => {
  const k = mini ? 0.62 : 1;
  const shots = (names: string[], kind: "laptop" | "tablet" | "phone") => Promise.all(names.map((n) => env.shot(n, Math.round(SCREEN_PX[kind][0] * k), Math.round(SCREEN_PX[kind][1] * k))));
  const [lt, tt, pt] = await Promise.all([
    shots(["siqetra", "assistant", "cordial", "/cases/predictive-maintenance"], "laptop"),
    shots(["grace", "support", "wrk"], "tablet"),
    shots(["phone-beanstalk", "phone-civilchat", "phone-faith3"], "phone"),
  ]);

  const group = new THREE.Group();
  const laptop = makeLaptop(lt[0]);
  const tablet = makeTablet(tt[0]);
  const phone = makePhone(pt[0]);
  env.textures.push(...laptop.textures, ...tablet.textures, ...phone.textures);

  const L = new THREE.Group();
  L.add(laptop.group);
  L.scale.setScalar(1.25);
  L.position.set(0.1, 0, -1.1);
  L.rotation.y = -0.12;
  L.add(shadow(env, 5.2, 3.8, 0.3, 0, 0.1));

  const T = standFor(tablet, 0.2);
  T.scale.setScalar(1.12);
  T.position.set(-3.0, 0, 1.3);
  T.rotation.y = 0.3;
  T.add(shadow(env, 4.4, 2.6, 0.3, 0, 0));

  const P = standFor(phone, 0.2);
  P.scale.setScalar(1.3);
  P.position.set(2.8, 0, 1.7);
  P.rotation.y = -0.34;
  P.add(shadow(env, 2.2, 1.8, 0.3, 0, 0));
  group.add(L, T, P);

  const fl = screenFader(laptop.screen!, lt, [0.3, 0.55, 0.8]);
  const ft = screenFader(tablet.screen!, tt, [0.4, 0.75]);
  const fp = screenFader(phone.screen!, pt, [0.5, 0.85]);

  const model: Model = {
    group,
    tags: [laptop.tagObj, tablet.tagObj, phone.tagObj],
    camera: { az: [-0.28, 0.2], elev: [0.28, 0.22] },
    floorY: 0,
    set(_a, _l, p) {
      laptop.open(0.9 + 0.1 * smooth(clamp01(p * 4)));
      fl(p);
      ft(p);
      fp(p);
      L.rotation.y = -0.12 + Math.sin(p * Math.PI) * 0.05;
      group.updateMatrixWorld(true);
    },
    frame: () => ({ cx: 0, cy: 1.6, hw: 5, hh: 2.6 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
