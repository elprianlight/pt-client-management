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

const BLUE = '#3b9bff'
const VIOLET = '#8b6dff'
const CYAN = '#22d3ee'
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
        <meshPhysicalMaterial color="#1e2a4d" metalness={0.75} roughness={0.28} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      {/* Pita aksen di badan */}
      <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.002, 0.07, 24, 96]} />
        <meshStandardMaterial color={BLUE} emissive={BLUE} emissiveIntensity={0.7} metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Pegangan */}
      <mesh position={[0, 0.98, 0]}>
        <torusGeometry args={[0.55, 0.13, 24, 64, Math.PI * 1.0]} />
        <meshPhysicalMaterial color="#c7d2fe" metalness={0.9} roughness={0.2} clearcoat={1} />
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

export default function GymScene({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0.2, 6.4], fov: 40 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 5, 5]} intensity={2.4} />
        <pointLight position={[-4, -1, 3]} intensity={20} color={CYAN} />
        <pointLight position={[4, -3, 2]} intensity={14} color={VIOLET} />

        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.7}>
          <Kettlebell />
        </Float>
        <PulseRing />
        <MiniDumbbell position={[-2.9, 1.5, -0.6]} rotation={[0.3, 0.4, 0.6]} />
        <MiniDumbbell position={[3.0, -1.4, -0.3]} rotation={[0.2, -0.5, -0.4]} />
        <Leaf position={[2.7, 1.6, -0.8]} color={MINT} scale={0.7} />
        <Leaf position={[-2.5, -1.7, -0.5]} color={MINT} scale={0.55} />
        <Sparkles count={50} scale={[8, 5, 4]} size={2} speed={0.35} color="#bcd4ff" opacity={0.6} />
      </Canvas>
    </div>
  )
}
