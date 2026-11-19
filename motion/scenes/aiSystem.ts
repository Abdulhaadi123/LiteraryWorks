import * as THREE from "three";
import {
  box,
  clamp01,
  easeOut,
  lerp,
  outline,
  run,
  shadowFloor,
  smooth,
  std,
  win,
  type Stage,
} from "../stage";

/**
 * Architectural Physical Scale Model.
 * Modeled entirely in procedural code (Three.js): frosted acrylic floor plates,
 * architectural steel columns, fine line geometry, and natural daylight illumination.
 * Styled after prestigious architectural studio presentation models.
 */
export function createScene(stage: Stage) {
  const { world, camera } = stage;

  // Soft architectural shadow floor
  const floor = shadowFloor();
  world.add(floor);

  const root = new THREE.Group();
  world.add(root);

  // Architectural Presentation Palette
  const COLOR_PLINTH = 0xede8df;        // Honed stone / warm plaster plinth
  const COLOR_LINE = 0xa3a8af;          // Precision pencil/drafting line
  const COLOR_STEEL = 0x223246;         // Deep architectural navy steel
  const COLOR_BRONZE = 0xb48d55;        // Anodized architectural bronze
  const COLOR_SLAB = 0xffffff;          // Matte white architectural slab
  const COLOR_GLASS = 0xf0f5fa;         // Translucent architectural glass
  const COLOR_CONDUIT_BLUE = 0x1f86c3;  // Engineering MEP Blue (like Blackpearl)
  const COLOR_CONDUIT_GOLD = 0xc59b58;  // Engineering MEP Bronze

  const floorAccents = [
    COLOR_STEEL,
    COLOR_BRONZE,
    COLOR_CONDUIT_BLUE,
    COLOR_STEEL,
    COLOR_BRONZE,
    0x2e7d32, // Refined forest green for governance
  ];

  // Plinth Foundation (Honed Limestone Model Base)
  const baseMesh = box(7.6, 0.36, 5.8, COLOR_PLINTH);
  const foundationBase = outline(baseMesh, COLOR_LINE);
  foundationBase.position.y = 0.18;
  root.add(foundationBase);

  // Inset drafting grid on the plinth
  const gridMat = new THREE.LineBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.32,
  });
  for (let i = 0; i < 9; i++) {
    const x = -3.2 + i * 0.8;
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.37, -2.5),
      new THREE.Vector3(x, 0.37, 2.5),
    ]);
    root.add(new THREE.Line(geom, gridMat));
  }
  for (let j = 0; j < 7; j++) {
    const z = -2.4 + j * 0.8;
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3.4, 0.37, z),
      new THREE.Vector3(3.4, 0.37, z),
    ]);
    root.add(new THREE.Line(geom, gridMat));
  }

  // Corner baseline markers
  const steelMat = std(COLOR_STEEL, { metalness: 0.6, roughness: 0.35 });
  const bronzeMat = std(COLOR_BRONZE, { metalness: 0.7, roughness: 0.28 });
  const whiteMat = std(COLOR_SLAB, { metalness: 0.1, roughness: 0.5 });

  const acrylicMaterial = new THREE.MeshPhysicalMaterial({
    color: COLOR_GLASS,
    transparent: true,
    opacity: 0.45,
    roughness: 0.2,
    metalness: 0.1,
    transmission: 0.6,
    thickness: 0.4,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const groups: THREE.Group[] = [];
  const markers: THREE.Object3D[] = [];
  const connectors: THREE.Group[] = [];

  const layerKeys = [
    "cloud",
    "data",
    "integrations",
    "applications",
    "agents",
    "governance",
  ] as const;

  // Build the 6 architectural floors
  for (let index = 0; index < 6; index++) {
    const group = new THREE.Group();
    root.add(group);
    groups.push(group);

    const accent = floorAccents[index];

    // Translucent architectural floor plate
    const floorSlab = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.12, 4.6), acrylicMaterial);
    floorSlab.position.set(0, 0.06, 0);
    floorSlab.receiveShadow = true;
    group.add(floorSlab);

    // Subtle edge framing perimeter
    const frame = outline(box(6.3, 0.1, 4.7, 0xf8fafc), 0xcbd5e1);
    frame.position.y = -0.04;
    group.add(frame);

    // Structural architectural columns
    for (const cx of [-2.85, 2.85]) {
      for (const cz of [-2.05, 2.05]) {
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 0.75, 12),
          index % 2 === 0 ? steelMat : bronzeMat
        );
        col.position.set(cx, 0.45, cz);
        col.castShadow = true;
        group.add(col);

        // Column cap
        const cap = box(0.2, 0.04, 0.2, accent);
        cap.position.set(cx, 0.82, cz);
        group.add(cap);
      }
    }

    // Floor-specific architectural models
    if (index === 0) {
      // 01 Foundation & Infrastructure: Precision structural blocks
      for (let k = 0; k < 4; k++) {
        const block = outline(box(0.9, 0.55, 1.2, 0xf1f5f9), 0x94a3b8);
        block.position.set(-1.8 + k * 1.2, 0.35, -0.5);
        group.add(block);

        const badge = box(0.3, 0.04, 0.6, COLOR_STEEL);
        badge.position.set(-1.8 + k * 1.2, 0.65, -0.5);
        group.add(badge);
      }
    } else if (index === 1) {
      // 02 BIM & Structural Framing: Clean architectural trusses
      const trussA = run(new THREE.Vector3(-2.6, 0.15, -1.8), new THREE.Vector3(2.6, 0.75, -1.8), steelMat, 0.035);
      const trussB = run(new THREE.Vector3(-2.6, 0.75, -1.8), new THREE.Vector3(2.6, 0.15, -1.8), steelMat, 0.035);
      group.add(trussA);
      group.add(trussB);

      for (let s = 0; s < 3; s++) {
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.6, 24), steelMat);
        cylinder.position.set(-1.6 + s * 1.6, 0.38, 0.5);
        group.add(cylinder);

        const brassRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.4, 0.02, 12, 24),
          bronzeMat
        );
        brassRing.rotation.x = Math.PI / 2;
        brassRing.position.set(-1.6 + s * 1.6, 0.48, 0.5);
        group.add(brassRing);
      }
    } else if (index === 2) {
      // 03 Integrations & MEP Conduits: Architectural piping runs
      const pipeRoutes = [
        [new THREE.Vector3(-2.5, 0.22, 1.3), new THREE.Vector3(0.0, 0.22, 1.3)],
        [new THREE.Vector3(0.0, 0.22, 1.3), new THREE.Vector3(0.0, 0.22, -1.2)],
        [new THREE.Vector3(0.0, 0.22, -1.2), new THREE.Vector3(2.4, 0.22, -1.2)],
        [new THREE.Vector3(-2.2, 0.45, -0.3), new THREE.Vector3(2.2, 0.45, -0.3)],
      ];
      const pipeMat = std(COLOR_CONDUIT_BLUE, { metalness: 0.5, roughness: 0.3 });
      for (const [pa, pb] of pipeRoutes) {
        const p = run(pa, pb, pipeMat, 0.035);
        group.add(p);
      }

      const hub = outline(box(0.7, 0.45, 0.7, 0xffffff), COLOR_BRONZE);
      hub.position.set(0, 0.3, 0);
      group.add(hub);
    } else if (index === 3) {
      // 04 Applications & Software: Control consoles and glass partition louvers
      const table = outline(box(4.2, 0.35, 1.8, 0xf8fafc), COLOR_STEEL);
      table.position.set(0, 0.25, 0);
      group.add(table);

      for (let sc = 0; sc < 3; sc++) {
        const screen = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.45, 0.04), steelMat);
        screen.position.set(-1.2 + sc * 1.2, 0.62, -0.4);
        group.add(screen);
      }
    } else if (index === 4) {
      // 05 AI Agents & Core: Elegant geometric centerpiece
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.48, 0),
        bronzeMat
      );
      core.position.set(0, 0.55, 0);
      group.add(core);

      const ringGeom = new THREE.TorusGeometry(1.1, 0.02, 12, 36);
      const ringMesh = new THREE.Mesh(ringGeom, steelMat);
      ringMesh.rotation.x = Math.PI / 2.8;
      ringMesh.position.set(0, 0.55, 0);
      group.add(ringMesh);

      for (let a = 0; a < 4; a++) {
        const angle = (a * Math.PI) / 2;
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), whiteMat);
        sphere.position.set(Math.cos(angle) * 1.6, 0.55, Math.sin(angle) * 1.2);
        group.add(sphere);

        const tether = run(new THREE.Vector3(0, 0.55, 0), sphere.position, bronzeMat, 0.012);
        group.add(tether);
      }
    } else if (index === 5) {
      // 06 Governance & Penthouse: Clean architectural pavilion
      const pavilion = outline(box(4.6, 0.55, 3.2, 0xffffff), COLOR_STEEL);
      pavilion.position.set(0, 0.36, 0);
      group.add(pavilion);

      const mast = run(new THREE.Vector3(1.7, 0.65, 1.1), new THREE.Vector3(1.7, 1.9, 1.1), steelMat, 0.035);
      group.add(mast);

      const dish = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.12, 16), bronzeMat);
      dish.position.set(1.7, 1.78, 1.1);
      dish.rotation.z = Math.PI / 3;
      group.add(dish);
    }

    // Inter-floor architectural riser rods
    if (index > 0) {
      const riser = run(
        new THREE.Vector3(-2.8, -0.65, -1.9),
        new THREE.Vector3(-2.8, 0.1, -1.9),
        steelMat,
        0.04
      );
      group.add(riser);
      connectors.push(riser);
    }

    // Anchor marker for HTML tracking label
    const marker = new THREE.Object3D();
    marker.position.set(2.85, 0.35, 0);
    group.add(marker);
    markers.push(marker);
  }

  // Label anchors matching the 6 architectural tiers
  const anchors = layerKeys.map((key, i) => ({
    key,
    position: new THREE.Vector3(),
    i,
  }));

  const baseCamPos = new THREE.Vector3(10, 8.5, 15);
  let globalP = 0;

  function setProgress(progress: number) {
    globalP = clamp01(progress);

    // Smooth architectural camera orbit
    camera.position.x = lerp(baseCamPos.x, 8.5, smooth(globalP));
    camera.position.y = lerp(baseCamPos.y, 11.2, smooth(globalP));
    camera.position.z = lerp(baseCamPos.z, 14.2, smooth(globalP));
    camera.lookAt(0, lerp(1.2, 3.8, smooth(globalP)), 0);

    // Elegant turntable turn
    root.rotation.y = lerp(-0.35, 0.3, smooth(globalP));

    // Staggered floor appearance and elevation (Exploded model view)
    const explodeT = smooth(win(globalP, 0.55, 0.98));

    groups.forEach((g, i) => {
      const appearWindow = win(globalP, i * 0.11, i * 0.11 + 0.22);
      const t = smooth(appearWindow);

      g.visible = t > 0.01;

      const normalY = 0.4 + i * 0.88;
      const explodedY = 0.4 + i * 1.5;
      const targetY = lerp(normalY, explodedY, explodeT);

      g.position.y = lerp(targetY + 2.2, targetY, easeOut(t));
      g.position.x = lerp((i % 2 === 0 ? -0.15 : 0.15) * (1 - t), 0, t);
      g.scale.setScalar(lerp(0.88, 1, easeOut(t)));

      markers[i].getWorldPosition(anchors[i].position);
    });
  }

  function render() {
    stage.render();
  }

  function dispose() {
    stage.dispose();
  }

  return {
    setProgress,
    render,
    labelAnchors: anchors,
    isLabelVisible: (key: string) => {
      const idx = layerKeys.indexOf(key as (typeof layerKeys)[number]);
      if (idx < 0) return false;
      return globalP >= idx * 0.11 + 0.05;
    },
    dispose,
  };
}
