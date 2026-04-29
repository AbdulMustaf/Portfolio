import { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import type { BufferGeometry, Group, Material } from 'three'

type SpiderManSymbioteModelProps = ThreeElements['group'] & {
  wireframeMode?: boolean
  mousePos?: { x: number; y: number }
}

interface ModelMeshNode {
  geometry: BufferGeometry
}

interface SymbioteGltf {
  nodes: Record<string, ModelMeshNode>
  materials: Record<string, Material>
}

const modelPath = '/spider-man-symbiote/spider-man-symbiote.glb'

export default function SpiderManSymbioteModel({
  wireframeMode = false,
  mousePos = { x: 0, y: 0 },
  ...props
}: SpiderManSymbioteModelProps) {
  const { nodes, materials } = useGLTF(modelPath) as unknown as SymbioteGltf
  const meshGroupRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (!meshGroupRef.current) return

    const targetRotationY = mousePos.x * 0.01
    const targetRotationX = -mousePos.y * 0.01

    meshGroupRef.current.rotation.y = THREE.MathUtils.lerp(
      meshGroupRef.current.rotation.y,
      targetRotationY + Math.PI,
      delta * 3,
    )
    meshGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      meshGroupRef.current.rotation.x,
      targetRotationX,
      delta * 3,
    )
  })

  const renderMaterial = (originalMaterial: Material) => {
    if (wireframeMode) {
      return <meshBasicMaterial wireframe color="#ffffff" transparent opacity={0.08} />
    }

    return <primitive object={originalMaterial} attach="material" />
  }

  return (
    <group {...props} dispose={null}>
      <group ref={meshGroupRef}>
        <group rotation={[1.732, 0.011, 0]}>
          <group rotation={[-Math.PI, 0, 0]}>
            <group position={[0, 0, 0]} rotation={[0.23, 0, Math.PI]}>
              <mesh geometry={nodes.BlackSpidey001_Red_0.geometry}>
                {renderMaterial(materials.material)}
              </mesh>
              <mesh geometry={nodes.BlackSpidey001_Black_0.geometry}>
                {renderMaterial(materials.Black)}
              </mesh>
              <mesh geometry={nodes.BlackSpidey001_EyeCloth_0.geometry}>
                {renderMaterial(materials.EyeCloth)}
              </mesh>
              <mesh geometry={nodes.BlackSpidey001_Web_0.geometry}>
                {renderMaterial(materials.material_3)}
              </mesh>
              <mesh geometry={nodes.BlackSpidey001_Web_0_1.geometry}>
                {renderMaterial(materials.material_3)}
              </mesh>
              <mesh geometry={nodes.BlackSpidey001_Web_0_2.geometry}>
                {renderMaterial(materials.material_3)}
              </mesh>
              <mesh geometry={nodes.BlackSpidey001_Glass_0.geometry}>
                {renderMaterial(materials.Glass)}
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

useGLTF.preload(modelPath)
