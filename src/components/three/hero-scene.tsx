'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Scene 3D dekoratif (barbel + cincin orbit + partikel).
 * Murni visual: tidak membaca/menulis data apa pun.
 * Interaktif: objek mengikuti gerakan kursor / sentuhan.
 */

const ACCENT = '#ee5a45'
const ACCENT_2 = '#ff9a6b'
const ACCENT_3 = '#b02a1c'

function Plate({ x, r, h, color }: { x: number; r: number; h: number; color: string }) {
  return (
    <mesh position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[r, r, h, 48]} />
      <meshPhysicalMaterial
        color={color}
        metalness={0.55}
        roughness={0.25}
        clearcoat={1}
        clearcoatRoughness={0.15}
      />
    </mesh>
  )
}

function Dumbbell() {
  const group = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    // Ikuti pointer secara halus
    const tx = state.pointer.y * 0.5
    const ty = state.pointer.x * 0.9
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, tx + 0.25, 3, delta)
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ty + state.clock.elapsedTime * 0.25, 3, delta)
  })

  return (
    <group ref={group} rotation={[0.25, 0, 0.35]} scale={0.95}>
      {/* Bar */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 3.6, 32]} />
        <meshPhysicalMaterial color="#e5e7eb" metalness={0.9} roughness={0.2} clearcoat={1} />
      </mesh>
      {/* Grip */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 1.1, 32]} />
        <meshStandardMaterial color="#1f2937" metalness={0.4} roughness={0.7} />
      </mesh>
      {/* Plates kiri & kanan */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Plate x={s * 1.05} r={0.85} h={0.22} color={ACCENT} />
          <Plate x={s * 1.3} r={0.68} h={0.2} color={ACCENT_2} />
          <Plate x={s * 1.52} r={0.5} h={0.18} color={ACCENT_3} />
          <Plate x={s * 1.72} r={0.14} h={0.22} color="#e5e7eb" />
        </group>
      ))}
    </group>
  )
}

function Rings() {
  const a = useRef<THREE.Mesh>(null)
  const b = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (a.current) a.current.rotation.z += delta * 0.35
    if (b.current) b.current.rotation.z -= delta * 0.22
  })

  return (
    <>
      <mesh ref={a} rotation={[1.15, 0.2, 0]}>
        <torusGeometry args={[2.5, 0.015, 16, 160]} />
        <meshBasicMaterial color={ACCENT_2} transparent opacity={0.7} />
      </mesh>
      <mesh ref={b} rotation={[0.6, -0.5, 0]}>
        <torusGeometry args={[3.1, 0.012, 16, 160]} />
        <meshBasicMaterial color={ACCENT_3} transparent opacity={0.5} />
      </mesh>
    </>
  )
}

function Orbs() {
  const items = useMemo(
    () => [
      { p: [-2.7, 1.3, -0.8] as const, s: 0.22, c: ACCENT_2 },
      { p: [2.8, -1.1, -0.4] as const, s: 0.3, c: ACCENT_3 },
      { p: [1.9, 1.9, -1.2] as const, s: 0.16, c: ACCENT },
      { p: [-2.2, -1.7, -0.6] as const, s: 0.18, c: ACCENT },
    ],
    []
  )
  return (
    <>
      {items.map((o, i) => (
        <Float key={i} speed={1.4 + i * 0.3} rotationIntensity={0.6} floatIntensity={1.2}>
          <mesh position={[...o.p]}>
            <icosahedronGeometry args={[o.s, 1]} />
            <meshStandardMaterial color={o.c} emissive={o.c} emissiveIntensity={0.55} roughness={0.35} />
          </mesh>
        </Float>
      ))}
    </>
  )
}

export default function HeroScene({
  className,
  offset = [0, 0],
  scale = 1,
}: {
  className?: string
  offset?: [number, number]
  scale?: number
}) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 6.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 5, 5]} intensity={2.2} color="#ffffff" />
        <pointLight position={[-4, -2, 3]} intensity={18} color={ACCENT_2} />
        <pointLight position={[4, -3, 2]} intensity={14} color={ACCENT_3} />

        <group position={[offset[0], offset[1], 0]} scale={scale}>
          <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.9}>
            <Dumbbell />
          </Float>
        </group>
        <Rings />
        <Orbs />
        <Sparkles count={60} scale={[8, 5, 4]} size={2.2} speed={0.4} color="#ffffff" opacity={0.6} />
      </Canvas>
    </div>
  )
}
