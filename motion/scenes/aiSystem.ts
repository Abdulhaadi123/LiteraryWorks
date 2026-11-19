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
 * Procedural Architectural Digital Twin & AI Systems Tower.
 * Engineered 100% in code using Three.js geometry, materials, and physics-based lighting.
 * Zero external .glb assets, fully deterministic scroll timeline.
 */
export function createScene(stage: Stage) {
  const { world, camera } = stage;

  // Shadow receiving floor with deep subtle opacity
  const floor = shadowFloor();
  world.add(floor);

  const root = new THREE.Group();
  world.add(root);

  // Technical color palette: Precision Obsidian, High-Vis Amber, Blueprint Cyan, Steel
  const COLOR_BASE = 0x0c1322;
  const COLOR_FRAME = 0x1e2c44;
  const COLOR_CYAN = 0x00f0ff;
  const COLOR_AMBER = 0xff6b00;
  const COLOR_STEEL = 0x8298b4;
  const COLOR_WHITE = 0xffffff;

  const layerColors = [
    COLOR_CYAN,   // 01 Cloud & Substructure
    0x38bdf8,     // 02 Data & BIM Framing
    COLOR_AMBER,  // 03 Integrations & MEP
    0xa855f7,     // 04 Apps & Curtain Walls
    COLOR_AMBER,  // 05 AI Swarms & Core
    0x22c55e,     // 06 Governance & Oversight
  ];

  // Foundation Substructure Bed
  const foundationBase = outline(box(7.4, 0.4, 6.0, COLOR_BASE), COLOR_CYAN);
  foundationBase.position.y = 0.2;
  root.add(foundationBase);

  // Precision CAD alignment grid on the foundation
  const gridMat = new THREE.LineBasicMaterial({
    color: COLOR_CYAN,
    transparent: true,
    opacity: 0.35,
  });
  for (let i = 0; i < 9; i++) {
    const x = -3.2 + i * 0.8;
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.42, -2.6),
      new THREE.Vector3(x, 0.42, 2.6),
    ]);
    root.add(new THREE.Line(geom, gridMat));
  }
  for (let j = 0; j < 7; j++) {
    const z = -2.4 + j * 0.8;
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3.4, 0.42, z),
      new THREE.Vector3(3.4, 0.42, z),
    ]);
    root.add(new THREE.Line(geom, gridMat));
  }

  // Ground level survey pylons
  const pylonMat = std(COLOR_FRAME, { metalness: 0.8, roughness: 0.2 });
  for (const px of [-3.4, 3.4]) {
    for (const pz of [-2.6, 2.6]) {
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 8), pylonMat);
      pylon.position.set(px, 0.5, pz);
      root.add(pylon);
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 8),
        new THREE.MeshBasicMaterial({ color: COLOR_AMBER })
      );
      beacon.position.set(px, 0.95, pz);
      root.add(beacon);
    }
  }

  const groups: THREE.Group[] = [];
  const markers: THREE.Object3D[] = [];
  const connectors: THREE.Group[] = [];
  const rotatingRings: THREE.Mesh[] = [];

  const layerKeys = [
    "cloud",
    "data",
    "integrations",
    "applications",
    "agents",
    "governance",
  ] as const;

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd0e8ff,
    transparent: true,
    opacity: 0.32,
    roughness: 0.15,
    metalness: 0.2,
    transmission: 0.6,
    thickness: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const structuralSteel = std(COLOR_FRAME, { metalness: 0.85, roughness: 0.25 });
  const beamMat = std(COLOR_STEEL, { metalness: 0.7, roughness: 0.3 });
  const pipeMat = new THREE.MeshStandardMaterial({
    color: COLOR_AMBER,
    emissive: COLOR_AMBER,
    emissiveIntensity: 0.6,
    metalness: 0.3,
    roughness: 0.2,
  });

  // Build the 6 architectural floors
  for (let index = 0; index < 6; index++) {
    const group = new THREE.Group();
    root.add(group);
    groups.push(group);

    const accent = layerColors[index];

    // Floor plate slab with technical edge
    const slab = outline(box(6.2, 0.14, 4.6, 0x111c30), accent);
    slab.position.set(0, 0.07, 0);
    group.add(slab);

    // Architectural perimeter safety glass
    const glassFence = new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.45, 4.5), glassMaterial);
    glassFence.position.set(0, 0.35, 0);
    group.add(glassFence);

    // Heavy corner structural I-columns
    for (const cx of [-2.85, 2.85]) {
      for (const cz of [-2.05, 2.05]) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.18), structuralSteel);
        col.position.set(cx, 0.52, cz);
        col.castShadow = true;
        group.add(col);

        // Column joint cap
        const cap = box(0.24, 0.06, 0.24, accent);
        cap.position.set(cx, 0.95, cz);
        group.add(cap);
      }
    }

    // Floor-specific specialized digital twin modules
    if (index === 0) {
      // 01 Cloud & Substructure: Core power units & edge servers
      for (let k = 0; k < 4; k++) {
        const rack = outline(box(0.9, 0.75, 1.2, 0x141f33), COLOR_CYAN);
        rack.position.set(-1.8 + k * 1.2, 0.45, -0.6);
        group.add(rack);

        // Server rack indicator LEDs
        for (let r = 0; r < 4; r++) {
          const led = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.03, 0.04),
            new THREE.MeshBasicMaterial({ color: r === 1 ? COLOR_AMBER : COLOR_CYAN })
          );
          led.position.set(-1.8 + k * 1.2, 0.25 + r * 0.12, 0.02);
          group.add(led);
        }
      }
    } else if (index === 1) {
      // 02 Data & BIM Framing: Structural cross-trusses & data silos
      const trussA = run(new THREE.Vector3(-2.6, 0.15, -1.8), new THREE.Vector3(2.6, 0.85, -1.8), beamMat, 0.04);
      const trussB = run(new THREE.Vector3(-2.6, 0.85, -1.8), new THREE.Vector3(2.6, 0.15, -1.8), beamMat, 0.04);
      group.add(trussA);
      group.add(trussB);

      for (let s = 0; s < 3; s++) {
        const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.72, 16), structuralSteel);
        silo.position.set(-1.6 + s * 1.6, 0.45, 0.4);
        group.add(silo);
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.44, 0.025, 8, 24),
          new THREE.MeshBasicMaterial({ color: COLOR_CYAN })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(-1.6 + s * 1.6, 0.55, 0.4);
        group.add(ring);
      }
    } else if (index === 2) {
      // 03 Integrations & MEP: High-capacity glowing conduit pipelines
      const pipeRoutes = [
        [new THREE.Vector3(-2.5, 0.25, 1.4), new THREE.Vector3(0.0, 0.25, 1.4)],
        [new THREE.Vector3(0.0, 0.25, 1.4), new THREE.Vector3(0.0, 0.25, -1.2)],
        [new THREE.Vector3(0.0, 0.25, -1.2), new THREE.Vector3(2.4, 0.25, -1.2)],
        [new THREE.Vector3(-2.2, 0.55, -0.4), new THREE.Vector3(2.2, 0.55, -0.4)],
      ];
      for (const [pa, pb] of pipeRoutes) {
        const p = run(pa, pb, pipeMat, 0.045);
        group.add(p);
      }

      // Valve and junction hubs
      const junction = outline(box(0.7, 0.6, 0.7, 0x16243b), COLOR_AMBER);
      junction.position.set(0, 0.4, 0);
      group.add(junction);
    } else if (index === 3) {
      // 04 Apps & Platforms: Modern interactive control consoles
      const desk = outline(box(4.2, 0.45, 1.8, 0x121e33), 0xa855f7);
      desk.position.set(0, 0.3, 0);
      group.add(desk);

      // Curved display screens
      for (let sc = 0; sc < 3; sc++) {
        const screen = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.55, 0.05),
          new THREE.MeshBasicMaterial({ color: sc === 1 ? 0xa855f7 : COLOR_CYAN })
        );
        screen.position.set(-1.3 + sc * 1.3, 0.75, -0.4);
        group.add(screen);
      }
    } else if (index === 4) {
      // 05 AI Agents & Core: Glowing central core with spinning holographic telemetry ring
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.55, 0),
        new THREE.MeshStandardMaterial({
          color: COLOR_AMBER,
          emissive: COLOR_AMBER,
          emissiveIntensity: 0.9,
          wireframe: false,
          roughness: 0.1,
          metalness: 0.9,
        })
      );
      core.position.set(0, 0.65, 0);
      group.add(core);

      const ringGeom = new THREE.TorusGeometry(1.2, 0.03, 12, 36);
      const ringMesh = new THREE.Mesh(
        ringGeom,
        new THREE.MeshBasicMaterial({ color: COLOR_CYAN, wireframe: true })
      );
      ringMesh.rotation.x = Math.PI / 2.8;
      ringMesh.position.set(0, 0.65, 0);
      group.add(ringMesh);
      rotatingRings.push(ringMesh);

      // Autonomous agent satellite nodes
      for (let a = 0; a < 4; a++) {
        const angle = (a * Math.PI) / 2;
        const sat = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 12, 10),
          new THREE.MeshBasicMaterial({ color: COLOR_WHITE })
        );
        sat.position.set(Math.cos(angle) * 1.8, 0.65, Math.sin(angle) * 1.3);
        group.add(sat);

        // Tether line to core
        const tether = run(new THREE.Vector3(0, 0.65, 0), sat.position, pipeMat, 0.015);
        group.add(tether);
      }
    } else if (index === 5) {
      // 06 Governance & Oversight: Observation penthouse, antennae & laser beacon
      const commandCenter = outline(box(4.8, 0.65, 3.4, 0x0f182b), 0x22c55e);
      commandCenter.position.set(0, 0.42, 0);
      group.add(commandCenter);

      // Communications array / telemetry mast
      const mast = run(new THREE.Vector3(1.8, 0.75, 1.2), new THREE.Vector3(1.8, 2.1, 1.2), structuralSteel, 0.04);
      group.add(mast);

      const dish = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.15, 16),
        new THREE.MeshStandardMaterial({ color: COLOR_CYAN, metalness: 0.8, roughness: 0.2 })
      );
      dish.position.set(1.8, 1.95, 1.2);
      dish.rotation.z = Math.PI / 3;
      group.add(dish);

      // Security beacon light
      const beaconLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0x22c55e })
      );
      beaconLight.position.set(-1.8, 0.95, -1.2);
      group.add(beaconLight);
    }

    // Inter-floor structural risers and data buses connecting floors
    if (index > 0) {
      const riserMat = new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.35,
        metalness: 0.6,
        roughness: 0.2,
      });
      const riser = run(
        new THREE.Vector3(-2.8, -0.65, -1.9),
        new THREE.Vector3(-2.8, 0.1, -1.9),
        riserMat,
        0.05
      );
      group.add(riser);
      connectors.push(riser);
    }

    // Label tracking marker anchor (placed at the outer edge of each floor)
    const marker = new THREE.Object3D();
    marker.position.set(2.85, 0.45, 0);
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

    // Camera smoothly pans and elevates as user scrolls through the system
    camera.position.x = lerp(baseCamPos.x, 8.5, smooth(globalP));
    camera.position.y = lerp(baseCamPos.y, 11.5, smooth(globalP));
    camera.position.z = lerp(baseCamPos.z, 14.0, smooth(globalP));
    camera.lookAt(0, lerp(1.2, 4.2, smooth(globalP)), 0);

    // Root rotation gives an engaging cinematic perspective turn
    root.rotation.y = lerp(-0.35, 0.32, smooth(globalP));

    // Vertical spacing expands dynamically to reveal each subsystem (Exploded View)
    const explodeT = smooth(win(globalP, 0.55, 0.98));

    groups.forEach((g, i) => {
      // Staggered floor appearance
      const appearWindow = win(globalP, i * 0.11, i * 0.11 + 0.22);
      const t = smooth(appearWindow);

      g.visible = t > 0.01;

      // Base height per level + explosive elevation spacing
      const normalY = 0.4 + i * 0.88;
      const explodedY = 0.4 + i * 1.55;
      const targetY = lerp(normalY, explodedY, explodeT);

      // Entrance animation: drop in smoothly from above
      g.position.y = lerp(targetY + 2.5, targetY, easeOut(t));
      g.position.x = lerp((i % 2 === 0 ? -0.2 : 0.2) * (1 - t), 0, t);
      g.scale.setScalar(lerp(0.85, 1, easeOut(t)));

      // Update world positions for HTML tracking labels
      markers[i].getWorldPosition(anchors[i].position);
    });
  }

  function render() {
    // Subtle continuous animation for rotating AI rings and core
    const time = performance.now() * 0.0015;
    rotatingRings.forEach((ring, idx) => {
      ring.rotation.z = time * (idx % 2 === 0 ? 1 : -1);
      ring.rotation.y = time * 0.5;
    });

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
