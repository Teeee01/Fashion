"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ribbonState } from "@/lib/ribbon-state";

/* ──────────────────────────────────────────────────────────────
   The pleated silk ribbon: a tall strip that twists ~1.5 turns around
   a vertical axis, built from hundreds of very thin white slats laid
   side by side along its length. Small gaps and an alternating tilt
   between slats read as fine pleats under the light.
   ────────────────────────────────────────────────────────────── */

const TURNS = 1.5;
const SECONDS_PER_TURN = 40;
const BREATH_AMOUNT = 0.035; // ±3.5% extra twist
// Exactly three breaths per turn, so a 40s recording loops seamlessly.
const BREATH_SPEED = (Math.PI * 2 * 3) / SECONDS_PER_TURN;
const PLEAT_TILT = 0.06; // radians, alternating per slat
const SLAT_FILL = 0.88; // each slat fills 88% of its pitch; the rest is gap

export type RibbonSceneProps = {
  slats: number;
  /** "never" pauses rendering (e.g. while the hero is scrolled off-screen). */
  frameloop: "always" | "never";
  /** Reduced motion: hold still and skip the washed-out entrance. */
  still: boolean;
  /** Called once the first frame has been drawn. */
  onReady: () => void;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function Ribbon({ slats, still, onReady }: Omit<RibbonSceneProps, "frameloop">) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const ready = useRef(false);
  const { viewport } = useThree();

  // Size everything from the visible height so it scales with the window.
  const length = viewport.height * 1.6; // runs off the top and bottom
  const width = viewport.height * (viewport.aspect < 1 ? 0.22 : 0.26);
  const pitch = length / slats;
  const radius = width * 0.16; // a loose spiral, not a flat twist
  // Left-centre of the screen, behind the monogram.
  const x = -viewport.width / 2 + viewport.width * (viewport.aspect < 1 ? 0.34 : 0.22);

  const geometry = useMemo(
    () => new THREE.BoxGeometry(width, pitch * SLAT_FILL, width * 0.012),
    [width, pitch],
  );
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6, metalness: 0 }),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const layout = (twist: number) => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < slats; i++) {
      const t = i / (slats - 1) - 0.5;
      const theta = t * twist * Math.PI * 2;
      dummy.position.set(Math.sin(theta) * radius, t * length, Math.cos(theta) * radius);
      dummy.rotation.set(i % 2 ? PLEAT_TILT : -PLEAT_TILT, theta, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => layout(TURNS));

  useFrame((state, delta) => {
    if (!still) {
      // Constant slow spin plus a barely-there breathing twist. Never stops.
      if (group.current) group.current.rotation.y += (delta * Math.PI * 2) / SECONDS_PER_TURN;
      layout(TURNS * (1 + BREATH_AMOUNT * Math.sin(state.clock.elapsedTime * BREATH_SPEED)));
    }

    // Contrast: washed-out (strong ambient, weak key) → full light and shade.
    const c = still ? 1 : ribbonState.contrast;
    if (ambient.current) ambient.current.intensity = lerp(2.4, 0.9, c);
    if (key.current) key.current.intensity = lerp(0.3, 2.6, c);
    if (fill.current) fill.current.intensity = lerp(0.1, 0.45, c);

    if (!ready.current) {
      ready.current = true;
      requestAnimationFrame(onReady);
    }
  });

  return (
    <>
      <ambientLight ref={ambient} />
      {/* Soft key from the top-left, weak fill from the lower right. */}
      <directionalLight ref={key} position={[-6, 7, 6]} />
      <directionalLight ref={fill} position={[5, -2, 4]} />
      <group ref={group} position={[x, 0, 0]}>
        <instancedMesh ref={mesh} args={[geometry, material, slats]} frustumCulled={false} />
      </group>
    </>
  );
}

export default function RibbonScene({ slats, frameloop, still, onReady }: RibbonSceneProps) {
  return (
    <Canvas
      frameloop={still ? "demand" : frameloop}
      dpr={[1, 1.75]}
      flat
      camera={{ position: [0, 0, 10], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Ribbon key={slats} slats={slats} still={still} onReady={onReady} />
    </Canvas>
  );
}
