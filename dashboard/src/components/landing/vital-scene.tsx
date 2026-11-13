"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Track = { stops: number[]; values: number[] };

const TRACKS: Record<"severity" | "stream" | "x" | "camZ" | "rotY" | "flatten", Track> = {
  severity: { stops: [0, 0.36, 0.42, 0.58, 0.66, 0.84, 0.9, 1], values: [0, 0, 1, 1, 2, 2, 0, 0] },
  stream: { stops: [0, 0.13, 0.26, 1], values: [0.15, 0.5, 1, 0.6] },
  x: { stops: [0, 0.2, 1], values: [2.3, -2.3, -2.3] },
  camZ: { stops: [0, 0.26, 0.5, 0.74, 0.98, 1], values: [8.4, 7.4, 6.8, 6, 7.6, 7.6] },
  rotY: { stops: [0, 0.26, 0.5, 0.74, 0.98], values: [-0.28, 0.32, 0.16, -0.12, 0] },
  flatten: { stops: [0, 0.86, 0.95, 1], values: [1, 1, 0.62, 0.56] },
};

const CALM = new THREE.Color("#2fae82");
const WARN = new THREE.Color("#e6a03a");
const CRIT = new THREE.Color("#e8405e");
const PARTICLES = 72;

function track({ stops, values }: Track, p: number): number {
  if (p <= stops[0]) return values[0];
  for (let i = 1; i < stops.length; i += 1) {
    if (p <= stops[i]) {
      const t = (p - stops[i - 1]) / (stops[i] - stops[i - 1]);
      return values[i - 1] + (values[i] - values[i - 1]) * t;
    }
  }
  return values[values.length - 1];
}

function severityColor(severity: number, target: THREE.Color): THREE.Color {
  if (severity <= 1) return target.copy(CALM).lerp(WARN, severity);
  return target.copy(WARN).lerp(CRIT, Math.min(1, severity - 1));
}

function heartbeatCurve(): THREE.CatmullRomCurve3 {
  const beat: [number, number][] = [
    [0, 0], [0.45, 0], [0.75, 0.22], [1.05, 0], [1.35, 0], [1.5, -0.32], [1.64, 1.65],
    [1.79, -0.62], [1.95, 0], [2.45, 0], [2.85, 0.42], [3.25, 0], [4, 0],
  ];
  const points: THREE.Vector3[] = [];
  for (let b = 0; b < 3; b += 1) {
    const start = -6 + b * 4;
    beat.forEach(([dx, y], i) => {
      if (b > 0 && i === 0) return;
      const x = start + dx;
      points.push(new THREE.Vector3(x, y, Math.sin(x * 0.55) * 0.35));
    });
  }
  return new THREE.CatmullRomCurve3(points, false, "centripetal");
}

function Scene({ progress, reduced }: { progress: MotionValue<number>; reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const ribbon = useRef<THREE.MeshStandardMaterial>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const pulseMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const particles = useRef<THREE.InstancedMesh>(null);
  const particleMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const live = useRef({ severity: 0, stream: 0.15, x: 2.3, camZ: 8.4, rotY: -0.28, flatten: 1, along: 0.62, tiltX: 0, tiltY: 0 });

  const curve = useMemo(() => heartbeatCurve(), []);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 720, 0.055, 12, false), [curve]);
  const color = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: PARTICLES }, (_, i) => ({
        t: (i * 0.618) % 1,
        angle: i * 2.399,
        radius: 1.4 + ((i * 37) % 23) / 10,
        speed: 0.035 + ((i * 13) % 7) / 220,
        size: 0.03 + ((i * 7) % 5) / 140,
      })),
    [],
  );

  useFrame((state, delta) => {
    const p = progress.get();
    const s = live.current;
    const narrow = state.size.width < 768;
    const lambda = reduced ? 30 : 3.2;

    s.severity = THREE.MathUtils.damp(s.severity, track(TRACKS.severity, p), lambda, delta);
    s.stream = THREE.MathUtils.damp(s.stream, track(TRACKS.stream, p), lambda, delta);
    s.x = THREE.MathUtils.damp(s.x, narrow ? 0 : track(TRACKS.x, p), lambda, delta);
    s.camZ = THREE.MathUtils.damp(s.camZ, track(TRACKS.camZ, p) + (narrow ? 5 : 0), lambda, delta);
    s.rotY = THREE.MathUtils.damp(s.rotY, reduced ? 0 : track(TRACKS.rotY, p), lambda, delta);
    s.flatten = THREE.MathUtils.damp(s.flatten, track(TRACKS.flatten, p), lambda, delta);
    s.tiltX = THREE.MathUtils.damp(s.tiltX, reduced ? 0 : state.pointer.y * 0.12, 2.4, delta);
    s.tiltY = THREE.MathUtils.damp(s.tiltY, reduced ? 0 : state.pointer.x * 0.18, 2.4, delta);

    state.camera.position.z = s.camZ;
    state.camera.position.y = 0;
    state.camera.lookAt(0, 0, 0);

    if (group.current) {
      group.current.position.x = s.x;
      group.current.position.y = narrow ? -3.9 : 0;
      group.current.rotation.y = s.rotY + s.tiltY;
      group.current.rotation.x = -s.tiltX;
      group.current.scale.set(0.48, 0.48 * s.flatten, 0.48);
    }

    severityColor(s.severity, color);
    ribbon.current?.color.copy(color);
    ribbon.current?.emissive.copy(color);
    pulseMaterial.current?.color.copy(color).offsetHSL(0, 0, 0.12);
    light.current?.color.copy(color);
    particleMaterial.current?.color.copy(color);
    particleMaterial.current?.emissive.copy(color);

    if (!reduced) s.along = (s.along + delta * (0.11 + 0.12 * s.severity)) % 1;
    const point = curve.getPointAt(s.along);
    pulse.current?.position.copy(point);
    light.current?.position.copy(point);
    if (light.current) light.current.intensity = 3 + s.severity * 2.5;

    const mesh = particles.current;
    if (mesh) {
      const time = state.clock.elapsedTime;
      seeds.forEach((seed, i) => {
        const travel = reduced ? seed.t : (seed.t + time * seed.speed) % 1;
        const anchor = curve.getPointAt(travel);
        const spread = seed.radius * (1.6 - s.stream * 1.25);
        const angle = seed.angle + (reduced ? 0 : time * 0.25);
        dummy.position.set(
          anchor.x,
          anchor.y + Math.sin(angle) * spread,
          anchor.z + Math.cos(angle) * spread,
        );
        dummy.scale.setScalar(seed.size * (0.6 + s.stream * 0.8) * 10);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
      <directionalLight position={[-5, -2, -4]} intensity={0.5} />
      <group ref={group}>
        <mesh geometry={tube}>
          <meshStandardMaterial
            ref={ribbon}
            roughness={0.28}
            metalness={0.15}
            emissiveIntensity={0.38}
          />
        </mesh>
        <mesh ref={pulse}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshBasicMaterial ref={pulseMaterial} toneMapped={false} />
        </mesh>
        <pointLight ref={light} distance={5} decay={1.6} />
        <instancedMesh ref={particles} args={[undefined, undefined, PARTICLES]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial
            ref={particleMaterial}
            roughness={0.4}
            emissiveIntensity={0.55}
            transparent
            opacity={0.85}
          />
        </instancedMesh>
      </group>
    </>
  );
}

export default function VitalScene({
  progress,
  reduced,
  active,
}: {
  progress: MotionValue<number>;
  reduced: boolean;
  active: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 8.4], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <Scene progress={progress} reduced={reduced} />
    </Canvas>
  );
}
