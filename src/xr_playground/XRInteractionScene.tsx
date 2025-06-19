// import React, { useRef, useState, Suspense } from 'react'
// import { Canvas, useFrame } from '@react-three/fiber'
// import { XR, createXRStore, useXREvent } from '@react-three/xr'
// import { ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei'
// import * as THREE from 'three'

// const store = createXRStore()

// function Model({ url }: { url: string }) {
//   const { scene } = useGLTF(url)
//   return <primitive object={scene} />
// }

// export default function XRInteractionScene() {
//   const modelRef = useRef<THREE.Group>(null!)
//   const grabbing = useRef({ left: false, right: false })
//   const lastPositions = useRef<{ left?: THREE.Vector3; right?: THREE.Vector3 }>({})
//   const [scale, setScale] = useState(1)

//     useXREvent('selectstart', (e) => {
//     if (e.data.handedness === 'right') grabbing.current.right = true
//     })

//     useXREvent('selectend', (e) => {
//     if (e.data.handedness === 'right') grabbing.current.right = false
//     lastPositions.current.right = undefined
//     })

//     useXREvent('squeezestart', (e) => {
//     if (e.data.handedness === 'left') grabbing.current.left = true
//     })

//     useXREvent('squeezeend', (e) => {
//     if (e.data.handedness === 'left') grabbing.current.left = false
//     lastPositions.current.left = undefined
//     })


//   useFrame((state: any) => {
//     const leftCtrl = state.controllers.find((c: any) => c.inputSource.handedness === 'left')
//     const rightCtrl = state.controllers.find((c: any) => c.inputSource.handedness === 'right')

//     const model = modelRef.current
//     if (!model) return

//     if (grabbing.current.right && rightCtrl) {
//       model.position.copy((rightCtrl.grip ?? rightCtrl).position)
//     }

//     if (grabbing.current.left && leftCtrl) {
//       model.rotation.y += (leftCtrl.grip ?? leftCtrl).position.x * 0.01
//     }

//     if (grabbing.current.left && grabbing.current.right && leftCtrl && rightCtrl) {
//       const lp = (leftCtrl.grip ?? leftCtrl).position
//       const rp = (rightCtrl.grip ?? rightCtrl).position
//       const dist = lp.distanceTo(rp)

//       if (lastPositions.current.left && lastPositions.current.right) {
//         const lastDist = lastPositions.current.left.distanceTo(lastPositions.current.right)
//         const factor = dist / lastDist
//         setScale((s) => THREE.MathUtils.clamp(s * factor, 0.1, 10))
//       }

//       lastPositions.current.left = lp.clone()
//       lastPositions.current.right = rp.clone()
//     }
//   })

//   return (
//     <Canvas shadows gl={{ localClippingEnabled: true }}>
//       <XR store={store}>
//         <Suspense fallback={null}>
//           <group ref={modelRef} position={[0, 1.5, -1]} scale={[scale, scale, scale]}>
//             <Model url="/models/mesh1.glb" />
//           </group>
//         </Suspense>

//         <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={10} />
//         <Environment preset="sunset" />
//         <OrbitControls />
//       </XR>
//     </Canvas>
//   )
// }
export {}