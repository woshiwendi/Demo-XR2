// // src/xr_playground/XRMeshLoaderScene.tsx
// import React, { Suspense, useEffect } from 'react'
// import { Canvas } from '@react-three/fiber'
// import { XR, createXRStore } from '@react-three/xr'
// import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
// import { SMesh, XMesh } from "./mesh";  // 假设你 XMesh 放在这里
// import { usePlaygroundStore } from '../playground/state/store'
// import { useShallow } from 'zustand/shallow'
// import { selector as playgroundSelector } from '../playground/state'
// import * as THREE from 'three'

// const store = createXRStore({
//   controller: {
//     left: { rayPointer: { rayModel: { color: 'black' } } },
//     right: { rayPointer: { rayModel: { color: 'black' } } },
//   },
// })

// export default function XRMeshLoaderScene() {
//   const { meshes, init, selected } = usePlaygroundStore(useShallow(playgroundSelector))

//   useEffect(() => {
//     // 启动时加载当前 active playground
//     init({ id: 'default-id', title: 'XR Playground', meshes: [] })
//   }, [init])

//   return (
//     <>
//       <button onClick={() => store.enterAR()}
//               style={{position:'absolute', top:20, left:20, zIndex:1}}>
//         {store.session ? 'Exit AR' : 'Enter AR'}
//       </button>
//       <Canvas shadows>
//         <XR store={store}>
//           <ambientLight intensity={1} />
//           <directionalLight position={[5, 5, 5]} castShadow />
//           <Environment preset="warehouse" />
//           <ContactShadows position={[0, -0.01, 0]} scale={10} opacity={0.4} blur={1.5} far={2} />

//           <Suspense fallback={null}>
//             {meshes.map(mesh => (
//               <XMesh
//                 key={mesh.id}
//                 mesh={mesh}
//                 position={mesh.position.toArray()}
//                 autoRotate={false}
//               />
//             ))}
//           </Suspense>

//           <OrbitControls />
//         </XR>
//       </Canvas>
//     </>
//   )
// }
export {}