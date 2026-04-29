import { Suspense } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import SpiderManSymbioteModel from './SpiderManSymbioteModel'

interface Props {
  mousePos: { x: number; y: number }
}

// Controls the 3D model framing inside the canvas.
// Lower scale or raise fov if the mask touches/crops against the canvas edges.
// More negative Y moves the model down inside the canvas.
const maskScale = 0.061
const maskPosition: [number, number, number] = [0, -0.18, 0]

export default function SymbioteMaskCanvas({ mousePos }: Props) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, -12], fov: 26, near: 0.1, far: 50 }}
      gl={{ alpha: true, antialias: true }}
      style={{ pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={2} />
        <directionalLight position={[0, 5, 5]} intensity={4} color="#ffffff" />
        <spotLight position={[5, 5, -5]} intensity={5} color="#ff4444" />
        <SpiderManSymbioteModel
          scale={maskScale}
          position={maskPosition}
          mousePos={mousePos}
        />
        <Environment resolution={256} preset="city">
          <group rotation={[-Math.PI / 3, 4, 1]}>
            <Lightformer form="circle" intensity={4} position={[0, 5, -9]} scale={10} />
            <Lightformer form="circle" intensity={4} position={[0, 3, 1]} scale={10} />
          </group>
        </Environment>
      </Suspense>
    </Canvas>
  )
}
