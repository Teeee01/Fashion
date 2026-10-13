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
/** Canvas height ÷ screen height (see RibbonStage / .hero-ribbon). */
export const CANVAS_OVERSCAN = 1.2;
/** Scroll progress 0 → 1 tightens the twist by this much (1.5 → ~2.6 turns)… */
const SCROLL_TWIST = 0.75;
/** …and adds this much rotation on top of the constant spin. */
const SCROLL_ROTATION = Math.PI;
/** In the footer the ribbon shrinks to this scale behind the wordmark. */
const OUTRO_SCALE = 0.3;
/** Fraction of the ribbon's length over which each end tapers. */
const TAPER = 0.12;
const SLAT_FILL = 0.88; // each slat fills 88% of its pitch; the rest is gap

export type RibbonSceneProps = {
  slats: number;
  /** "never" pauses rendering (e.g. once the ribbon has faded out). */
  frameloop: "always" | "never";
  /** Reduced motion: hold still and skip the washed-out entrance. */
  still: boolean;
  /** Phones (< 768px): a smaller ribbon, centred behind the monogram. */
  mobile: boolean;
  /** Called once the first frame has been drawn. */
  onReady: () => void;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Phones: ribbon width as a fraction of the screen height. */
const MOBILE_WIDTH = 0.16;
/** The hero monogram: 13vw from the left, 22vh tall, glyph width ÷ height. */
const MONOGRAM = { left: 0.13, height: 0.22, aspect: 1230 / 1558 };
/** Horizontal centre of the hero monogram, as a fraction of screen width. */
export const monogramCentre = (screenAspect: number) =>
  MONOGRAM.left + (MONOGRAM.height * MONOGRAM.aspect) / (2 * screenAspect);

function Ribbon({ slats, still, mobile, onReady }: Omit<RibbonSceneProps, "frameloop">) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const ready = useRef(false);
  const spin = useRef(0);
  const { viewport } = useThree();

  // The canvas is 20% taller than the screen (10% spare above and below, so
  // the ribbon still runs off both edges after it drifts down). Sizes are
  // based on the screen height so the ribbon looks the same either way.
  const screenHeight = viewport.height / CANVAS_OVERSCAN;
  const length = viewport.height * 1.4; // runs off the top and bottom
  const width = screenHeight * (mobile ? MOBILE_WIDTH : 0.26);
  const pitch = length / slats;
  const radius = width * 0.16; // a loose spiral, not a flat twist
  // Starts left-centre (behind the monogram) and travels to the right side
  // of the screen as the manifesto scrolls by.
  // On phones it starts exactly centred behind the monogram.
  const start = mobile ? monogramCentre(viewport.aspect * CANVAS_OVERSCAN) : 0.22;
  const xAt = (p: number) => -viewport.width / 2 + viewport.width * lerp(start, mobile ? 0.66 : 0.74, p);

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
      // Both ends taper to a soft point (only ever seen when the ribbon is
      // small, in the footer; in the hero the ends run off-screen).
      const edge = Math.min((0.5 - Math.abs(t)) / TAPER, 1);
      dummy.scale.set(Math.max(Math.sin((edge * Math.PI) / 2), 0.02), 1, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => layout(TURNS));

  useFrame((state, delta) => {
    if (!still) {
      // Constant slow spin plus a barely-there breathing twist. Never stops.
      // Scroll progress moves it right, adds rotation and tightens the twist.
      // In the footer (outro 0 → 1) it glides to sit small behind the
      // wordmark and its twist relaxes again.
      const p = ribbonState.progress;
      const o = ribbonState.outro;
      spin.current += (delta * Math.PI * 2) / SECONDS_PER_TURN;
      if (group.current) {
        group.current.rotation.y = spin.current + p * SCROLL_ROTATION;
        const outroX = -viewport.width / 2 + viewport.width * ribbonState.outroX;
        const outroY = (0.5 - ribbonState.outroY) * screenHeight;
        group.current.position.x = lerp(xAt(p), outroX, o);
        group.current.position.y = lerp(0, outroY, o);
        group.current.scale.setScalar(lerp(1, OUTRO_SCALE, o));
      }
      const breath = 1 + BREATH_AMOUNT * Math.sin(state.clock.elapsedTime * BREATH_SPEED);
      layout(TURNS * breath * (1 + p * SCROLL_TWIST * (1 - o)));
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
      <group ref={group} position={[xAt(0), 0, 0]}>
        <instancedMesh ref={mesh} args={[geometry, material, slats]} frustumCulled={false} />
      </group>
    </>
  );
}

export default function RibbonScene({ slats, frameloop, still, mobile, onReady }: RibbonSceneProps) {
  return (
    <Canvas
      frameloop={still ? "demand" : frameloop}
      dpr={[1, 1.75]}
      flat
      camera={{ position: [0, 0, 10], fov: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Ribbon key={slats} slats={slats} still={still} mobile={mobile} onReady={onReady} />
    </Canvas>
  );
}
