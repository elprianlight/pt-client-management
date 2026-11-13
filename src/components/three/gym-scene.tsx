'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Scene 3D bertema gym & wellness: kettlebell, cincin detak jantung,
 * dumbbell mini, dan "daun" wellness yang melayang.
 * Murni dekoratif — tidak membaca/menulis data. Mengikuti kursor/sentuhan.
 */

const BLUE = '#ee5a45'
const VIOLET = '#b02a1c'
const CYAN = '#ff9a6b'
const MINT = '#4ade80'

function Kettlebell() {
  const g = useRef<THREE.Group>(null)
  useFrame((state, delta) => {
    if (!g.current) return
    g.current.rotation.y = THREE.MathUtils.damp(
      g.current.rotation.y,
      state.pointer.x * 0.9 + Math.sin(state.clock.elapsedTime * 0.5) * 0.25,
      3,
      delta
    )
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, -state.pointer.y * 0.35, 3, delta)
  })
  return (
    <group ref={g} scale={1.05}>
      {/* Badan */}
      <mesh position={[0, -0.2, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial color="#2a2421" metalness={0.75} roughness={0.28} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      {/* Pita aksen di badan */}
      <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.002, 0.07, 24, 96]} />
        <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={0.7} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Pegangan */}
      <mesh position={[0, 0.98, 0]}>
        <torusGeometry args={[0.55, 0.13, 24, 64, Math.PI * 1.0]} />
        <meshPhysicalMaterial color="#eadbd3" metalness={0.9} roughness={0.2} clearcoat={1} />
      </mesh>
      {/* Bobot (label) */}
      <mesh position={[0, -0.2, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 40]} />
        <meshStandardMaterial color={VIOLET} emissive={VIOLET} emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

function PulseRing() {
  const ring = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Detak jantung: dua denyut cepat lalu jeda
    const beat = (x: number) => Math.max(0, Math.sin(x * 6.0)) ** 8
    const s = 1 + beat(t) * 0.12 + beat(t + 0.3) * 0.06
    if (ring.current) ring.current.scale.setScalar(s)
    if (ring2.current) {
      ring2.current.scale.setScalar(1.12 + beat(t - 0.15) * 0.1)
      ring2.current.rotation.z += 0.003
    }
  })
  return (
    <>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0.15, 0]} position={[0, -0.2, 0]}>
        <torusGeometry args={[2.25, 0.018, 16, 200]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.85} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 2.4, 0.15, 0]} position={[0, -0.2, 0]}>
        <torusGeometry args={[2.7, 0.01, 16, 200]} />
        <meshBasicMaterial color={BLUE} transparent opacity={0.45} />
      </mesh>
    </>
  )
}

function MiniDumbbell({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <Float speed={1.8} rotationIntensity={0.9} floatIntensity={1.3}>
      <group position={position} rotation={rotation} scale={0.42}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 1.8, 20]} />
          <meshStandardMaterial color="#e5e7eb" metalness={0.9} roughness={0.25} />
        </mesh>
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 0.28, 32]} />
            <meshPhysicalMaterial color={BLUE} metalness={0.5} roughness={0.25} clearcoat={1} />
          </mesh>
        ))}
      </group>
    </Float>
  )
}

function Leaf({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  return (
    <Float speed={1.2} rotationIntensity={1.2} floatIntensity={1.6}>
      <mesh position={position} scale={[scale * 0.55, scale, scale * 0.18]}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.4} />
      </mesh>
    </Float>
  )
}

export type GymVariant =
  | 'kettlebell'
  | 'dumbbell'
  | 'capsule'
  | 'apple'
  | 'bars'
  | 'donut'
  | 'gear'

/** Mengikuti pointer secara halus untuk grup objek utama. */
function PointerGroup({ children, spin = 0 }: { children: React.ReactNode; spin?: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame((state, delta) => {
    if (!g.current) return
    g.current.rotation.y = THREE.MathUtils.damp(
      g.current.rotation.y,
      state.pointer.x * 0.9 + state.clock.elapsedTime * spin,
      3,
      delta
    )
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, -state.pointer.y * 0.35, 3, delta)
  })
  return <group ref={g}>{children}</group>
}

function BigDumbbell() {
  return (
    <PointerGroup spin={0.25}>
      <group rotation={[0.2, 0, 0.4]} scale={0.95}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 3.4, 32]} />
          <meshPhysicalMaterial color="#e5e7eb" metalness={0.9} roughness={0.2} clearcoat={1} />
        </mesh>
        {[-1, 1].map((sx) => (
          <group key={sx}>
            {[
              { x: 1.05, r: 0.85, c: BLUE },
              { x: 1.32, r: 0.66, c: VIOLET },
              { x: 1.55, r: 0.48, c: CYAN },
            ].map((pl) => (
              <mesh key={pl.x} position={[sx * pl.x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[pl.r, pl.r, 0.2, 48]} />
                <meshPhysicalMaterial color={pl.c} metalness={0.55} roughness={0.25} clearcoat={1} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </PointerGroup>
  )
}

function Capsules() {
  const levels = [0.85, 0.55, 0.3]
  const cols = [BLUE, CYAN, VIOLET]
  return (
    <PointerGroup spin={0.15}>
      {levels.map((lv, i) => (
        <Float key={i} speed={1.4 + i * 0.3} floatIntensity={1.1} rotationIntensity={0.3}>
          <group position={[(i - 1) * 1.35, 0, 0]} rotation={[0, 0, (i - 1) * -0.12]}>
            {/* Tabung kaca */}
            <mesh>
              <capsuleGeometry args={[0.42, 1.7, 12, 32]} />
              <meshPhysicalMaterial color="#ffe3dc" transparent opacity={0.22} roughness={0.05} transmission={0.6} thickness={0.4} clearcoat={1} />
            </mesh>
            {/* Cairan = sisa sesi */}
            <mesh position={[0, -0.85 + lv * 0.85, 0]} scale={[1, lv, 1]}>
              <capsuleGeometry args={[0.34, 1.5, 10, 28]} />
              <meshStandardMaterial color={cols[i]} emissive={cols[i]} emissiveIntensity={0.7} roughness={0.35} />
            </mesh>
            {/* Tutup */}
            <mesh position={[0, 1.45, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.18, 24]} />
              <meshStandardMaterial color="#e5e7eb" metalness={0.8} roughness={0.25} />
            </mesh>
          </group>
        </Float>
      ))}
    </PointerGroup>
  )
}

function AppleScene() {
  return (
    <PointerGroup spin={0.2}>
      <Float speed={1.5} floatIntensity={0.8}>
        <mesh>
          <sphereGeometry args={[1.05, 64, 64]} />
          <meshPhysicalMaterial color="#ef4d6a" metalness={0.15} roughness={0.28} clearcoat={1} clearcoatRoughness={0.1} />
        </mesh>
        <mesh position={[0, 1.12, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.05, 0.07, 0.38, 12]} />
          <meshStandardMaterial color="#6b4423" />
        </mesh>
        <mesh position={[0.32, 1.22, 0]} rotation={[0, 0, -0.7]} scale={[0.5, 0.2, 0.2]}>
          <sphereGeometry args={[0.6, 24, 24]} />
          <meshStandardMaterial color={MINT} emissive={MINT} emissiveIntensity={0.4} />
        </mesh>
      </Float>
      {[
        [-2.2, 0.8, -0.3],
        [2.3, -0.6, -0.2],
        [1.7, 1.5, -0.8],
      ].map((p, i) => (
        <Float key={i} speed={1.8 + i * 0.4} floatIntensity={1.6}>
          <mesh position={p as [number, number, number]} scale={[0.5, 0.7, 0.5]}>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshPhysicalMaterial color={CYAN} transmission={0.7} roughness={0.05} thickness={0.5} emissive={CYAN} emissiveIntensity={0.25} />
          </mesh>
        </Float>
      ))}
    </PointerGroup>
  )
}

function Bars() {
  const heights = [0.7, 1.1, 0.9, 1.6, 2.1]
  return (
    <PointerGroup spin={0.12}>
      <group position={[0, -0.9, 0]}>
        {heights.map((h, i) => (
          <mesh key={i} position={[(i - 2) * 0.82, h / 2, 0]}>
            <boxGeometry args={[0.56, h, 0.56]} />
            <meshPhysicalMaterial
              color={i === heights.length - 1 ? CYAN : BLUE}
              emissive={i === heights.length - 1 ? CYAN : BLUE}
              emissiveIntensity={0.35 + i * 0.1}
              metalness={0.4}
              roughness={0.25}
              clearcoat={1}
            />
          </mesh>
        ))}
        {/* Alas */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[4.6, 0.08, 1.2]} />
          <meshStandardMaterial color="#2a2421" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </PointerGroup>
  )
}

function Donut() {
  const arcs = [
    { c: BLUE, a: Math.PI * 1.1, r: 0 },
    { c: VIOLET, a: Math.PI * 0.6, r: Math.PI * 1.1 },
    { c: CYAN, a: Math.PI * 0.3, r: Math.PI * 1.7 },
  ]
  return (
    <PointerGroup spin={0.18}>
      <group rotation={[Math.PI / 2.6, 0, 0]}>
        {arcs.map((a, i) => (
          <mesh key={i} rotation={[0, 0, a.r]}>
            <torusGeometry args={[1.25, 0.38, 28, 80, a.a - 0.06]} />
            <meshPhysicalMaterial color={a.c} emissive={a.c} emissiveIntensity={0.4} metalness={0.3} roughness={0.25} clearcoat={1} />
          </mesh>
        ))}
      </group>
    </PointerGroup>
  )
}

function Gear() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.z += d * 0.35
  })
  const teeth = 10
  return (
    <PointerGroup>
      <group ref={ref}>
        <mesh>
          <torusGeometry args={[1, 0.34, 24, 64]} />
          <meshPhysicalMaterial color="#eadbd3" metalness={0.85} roughness={0.25} clearcoat={1} />
        </mesh>
        {Array.from({ length: teeth }).map((_, i) => {
          const a = (i / teeth) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 1.42, Math.sin(a) * 1.42, 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.36, 0.34, 0.6]} />
              <meshPhysicalMaterial color={BLUE} metalness={0.7} roughness={0.25} />
            </mesh>
          )
        })}
        <mesh>
          <cylinderGeometry args={[0.28, 0.28, 0.7, 32]} />
          <meshStandardMaterial color={VIOLET} emissive={VIOLET} emissiveIntensity={0.6} />
        </mesh>
      </group>
    </PointerGroup>
  )
}

function Main({ variant }: { variant: GymVariant }) {
  switch (variant) {
    case 'dumbbell':
      return <BigDumbbell />
    case 'capsule':
      return <Capsules />
    case 'apple':
      return <AppleScene />
    case 'bars':
      return <Bars />
    case 'donut':
      return <Donut />
    case 'gear':
      return <Gear />
    default:
      return (
        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.7}>
          <Kettlebell />
        </Float>
      )
  }
}

export default function GymScene({ className, variant = 'kettlebell' }: { className?: string; variant?: GymVariant }) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0.2, 6.4], fov: 40 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 5, 5]} intensity={2.4} />
        <pointLight position={[-4, -1, 3]} intensity={20} color={CYAN} />
        <pointLight position={[4, -3, 2]} intensity={14} color={VIOLET} />

        <Main variant={variant} />
        <PulseRing />
        <MiniDumbbell position={[-2.9, 1.5, -0.6]} rotation={[0.3, 0.4, 0.6]} />
        <Leaf position={[2.7, 1.6, -0.8]} color={MINT} scale={0.7} />
        <Leaf position={[-2.5, -1.7, -0.5]} color={MINT} scale={0.55} />
        <Sparkles count={50} scale={[8, 5, 4]} size={2} speed={0.35} color="#ffd2c6" opacity={0.6} />
      </Canvas>
    </div>
  )
}
