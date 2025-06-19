import { useXR } from '@react-three/xr'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

type Props = {
  targetRef: React.RefObject<THREE.Object3D>
}

export default function ControllerDistanceScaler({ targetRef }: Props) {
  const { controllers } = useXR()
  const initialDistance = useRef<number | null>(null)
  const initialScale = useRef<THREE.Vector3 | null>(null)

  useFrame(() => {
    if (controllers.length < 2 || !targetRef.current) return

    const [left, right] = controllers
    const distance = left.position.distanceTo(right.position)

    // 初始化距离和初始缩放
    if (initialDistance.current === null || initialScale.current === null) {
      initialDistance.current = distance
      initialScale.current = targetRef.current.scale.clone()
      return
    }

    // 计算并应用缩放
    const scaleRatio = distance / initialDistance.current
    const newScale = initialScale.current.clone().multiplyScalar(scaleRatio)
    targetRef.current.scale.copy(newScale)
  })

  // 控制器变动时清除缓存
  useEffect(() => {
    return () => {
      initialDistance.current = null
      initialScale.current = null
    }
  }, [controllers.length])

  return null
}
