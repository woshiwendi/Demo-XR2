// src/xr_playground/index.tsx
import React, {
  useState,
  useMemo,
  useRef,
  Suspense,
  forwardRef,
  RefObject,
  useEffect
} from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { XR, createXRStore, useXR, Interactive } from '@react-three/xr'
import {
  Root,
  Defaults,
  DefaultProperties,
  Container,
  Text,
  GlassMaterial,
  MetalMaterial,
  setPreferredColorScheme
} from '@react-three/uikit'
import { colors } from '@react-three/uikit-default'
import { Environment, ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { XMesh } from '../playground/mesh'
import { usePlaygroundStore } from '../playground/state/store'
import { useShallow } from 'zustand/shallow'
import { clamp, damp } from 'three/src/math/MathUtils.js'
import ControllerDistanceScaler from './ControllerDistanceScaler'

// 🚀 XR store
const store = createXRStore({
  controller: {
    left: { rayPointer: { rayModel: { color: 'black' } } },
    right: { rayPointer: { rayModel: { color: 'black' } } },
  },
  enterGrantedSession: true,
  screenInput: true,
  handTracking: false,
  hitTest: true,
  planeDetection: false,
  anchors: true,
  gaze: false,
  domOverlay: true,
  originReferenceSpace: 'local-floor',
  bounded: false,
})

setPreferredColorScheme('dark')

// 🎶 Panel UI using UIKit
function MusicUI({ widthSig, heightSig }: { widthSig: React.MutableRefObject<number>; heightSig: React.MutableRefObject<number> }) {
  const width = widthSig.current
  const height = heightSig.current
  return (
    <DefaultProperties borderColor={colors.background}>
      <Defaults>
        <Root anchorY="bottom" width={width} height={height} pixelSize={0.0015}>
          <Container padding={8} backgroundColor={colors.background} borderRadius={16}
                     panelMaterialClass={MetalMaterial} borderBend={0.4} borderWidth={4}>
            <Text fontSize={18} fontWeight={500} color={colors.cardForeground} flexGrow={1}>
              XR UIKit Panel
            </Text>
            <Text fontSize={14} color={colors.cardForeground}>🎧</Text>
          </Container>
          <Container width="100%" flexDirection="column" backgroundColor={colors.background} padding={16}>
            <Text fontSize={14} color={colors.cardForeground}>Hello from the integrated panel!</Text>
            <Container flexDirection="row" justifyContent="space-around" paddingTop={8}>
              <Container width={30} height={30} backgroundColor={colors.accent}
                         borderRadius={100} alignItems="center" justifyContent="center">
                <Text fontSize={18} color="white">▶️</Text>
              </Container>
            </Container>
          </Container>
        </Root>
      </Defaults>
    </DefaultProperties>
  )
}

// 📦 Draggable component
function Draggable({ children, position = [0, 0, 0] }: { children: React.ReactNode; position?: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  const { controller } = useXR()
  const [grabbed, setGrabbed] = useState<'left' | 'right' | null>(null)
  const isDragging = useRef(false)

  const handleStart = (e: any) => {
    setGrabbed(e.controller)
    isDragging.current = true
  }
  const handleEnd = (e: any) => {
    if (e.controller === grabbed) {
      setGrabbed(null)
      isDragging.current = false
    }
  }

  useFrame(() => {
    if (grabbed && ref.current) {
      const ctrl = controller(grabbed)
      if (ctrl) {
        ref.current.position.copy(ctrl.position)
        ref.current.quaternion.copy(ctrl.quaternion)
      }
    }
  })

  return (
    <Interactive onSelectStart={handleStart} onSelectEnd={handleEnd}>
      <group ref={ref} position={position}>
        {children}
      </group>
    </Interactive>
  )
}

// 📈 GeneratedModel component with ScaleButtons
function GeneratedModel() {
  const gltf = useLoader(GLTFLoader, '/models/mesh1.glb')
  const modelRef = useRef<THREE.Group>(null)
  const [scale, setScale] = useState(1)

  const handleScaleChange = (factor: number) => {
    setScale(prev => clamp(prev * factor, 0.1, 5))
  }

  return (
    <>
      <Draggable position={[0, 1.0, -1]}>
        <group ref={modelRef} scale={[scale, scale, scale]}>
          <primitive object={gltf.scene} />
        </group>
      </Draggable>
      <ScaleButtons onScaleChange={handleScaleChange} />
    </>
  )
}

// ➕ ➖ ScaleButtons
function ScaleButtons({ onScaleChange }: { onScaleChange: (factor: number) => void }) {
  const roundedPlane = useMemo(() => {
    const shape = new THREE.Shape()
    const w = 0.2, h = 0.1, r = 0.02
    shape.moveTo(-w + r, -h)
    shape.lineTo(w - r, -h)
    shape.quadraticCurveTo(w, -h, w, -h + r)
    shape.lineTo(w, h - r)
    shape.quadraticCurveTo(w, h, w - r, h)
    shape.lineTo(-w + r, h)
    shape.quadraticCurveTo(-w, h, -w, h - r)
    shape.lineTo(-w, -h + r)
    shape.quadraticCurveTo(-w, -h, -w + r, -h)
    return new THREE.ShapeGeometry(shape)
  }, [])

  return (
    <>
      <Interactive onSelect={() => onScaleChange(1.1)}>
        <mesh position={[-0.6, 1.5, -1]} geometry={roundedPlane}>
          <meshStandardMaterial color="green" />
          <Text position={[0, 0, 0.01]} fontSize={0.05} anchorX="center" anchorY="middle" color="white">+</Text>
        </mesh>
      </Interactive>
      <Interactive onSelect={() => onScaleChange(0.9)}>
        <mesh position={[-0.6, 1.3, -1]} geometry={roundedPlane}>
          <meshStandardMaterial color="red" />
          <Text position={[0, 0, 0.01]} fontSize={0.05} anchorX="center" anchorY="middle" color="white">‑</Text>
        </mesh>
      </Interactive>
    </>
  )
}

// 🖼️ UploadedImage component
function UploadedImage({ imageUrl }: { imageUrl: string | null }) {
  const texture = useLoader(THREE.TextureLoader, imageUrl || '/placeholder.png')
  if (!imageUrl || !texture.image) return null
  const ar = texture.image.width / texture.image.height
  const h = 0.6, w = h * ar

  return (
    <Draggable position={[1.2, 1.3, -1]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </Draggable>
  )
}

// 🏁 Main component
export default function XRPlayground() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [showModel, setShowModel] = useState(false)
  const [pressedBtn, setPressedBtn] = useState<'upload' | 'generate' | null>(null)
  const playground = usePlaygroundStore(useShallow(state => ({ meshes: state.meshes })))
  
  const widthSig = useRef(600)
  const heightSig = useRef(300)

  const handleUpload = () => {
    setPressedBtn('upload')
    document.getElementById('uploadInput')?.click()
    setTimeout(() => setPressedBtn(null), 150)
  }

  const handleGenerate = () => {
    setPressedBtn('generate')
    setShowModel(true)
    setTimeout(() => setPressedBtn(null), 150)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImageUrl(URL.createObjectURL(file))
  }

  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const renderer = canvas.renderer || (THREE as any).WebGLRenderer ? new THREE.WebGLRenderer() : null
    if (renderer) renderer.xr.enabled = true
  }, [])

  return (
    <>
      <input id="uploadInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
      <button
        style={{ position: 'absolute', top: 20, left: 20, zIndex: 1 }}
        onClick={() => store.session ? store.exitXR() : store.enterAR({ requiredFeatures: ['hit-test'] })}
      >
        {store.session ? 'Exit XR' : 'Enter AR'}
      </button>

      <Canvas style={{ background: 'transparent' }} shadows gl={{ alpha: true }}>
        <XR store={store}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} />

          <Environment preset="warehouse" background />

          <group position={[0, 1.2, -1]}>
            <MusicUI widthSig={widthSig} heightSig={heightSig} />
          </group>

          <mesh position={[0.6, 1.5, -1]} onClick={handleUpload}>
            <planeGeometry args={[0.2, 0.1]} />
            <meshStandardMaterial color="black" transparent opacity={pressedBtn === 'upload' ? 0.5 : 0.8} side={2} />
            <Text position={[0, 0, 0.01]} fontSize={0.06} anchorX="center" anchorY="middle" color="white">Upload</Text>
          </mesh>
          
          <mesh position={[0.6, 1.2, -1]} onClick={handleGenerate}>
            <planeGeometry args={[0.2, 0.1]} />
            <meshStandardMaterial color="black" transparent opacity={pressedBtn === 'generate' ? 0.5 : 0.8} side={2} />
            <Text position={[0, 0, 0.01]} fontSize={0.06} anchorX="center" anchorY="middle" color="white">Generate</Text>
          </mesh>

          <UploadedImage imageUrl={imageUrl} />

          <Suspense fallback={null}>
            {playground.meshes.map(m => (
              <Draggable key={m.id} position={m.position.toArray() as [number, number, number]}>
                <XMesh mesh={m} autoRotate={false} />
              </Draggable>
            ))}
          </Suspense>

          {showModel && <Suspense fallback={null}><GeneratedModel /></Suspense>}

          <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={10} blur={1.5} />
          <OrbitControls />
          <ControllerDistanceScaler />
        </XR>
      </Canvas>
    </>
  )
}
// // // src/xr_playground/index.tsx
// import React, { useState, useMemo, useRef, Suspense } from 'react'
// import { Canvas, useLoader, useFrame } from '@react-three/fiber'
// import { XR, createXRStore, useXR, Interactive } from '@react-three/xr'
// import { Text, Environment, ContactShadows, OrbitControls } from '@react-three/drei'
// import * as THREE from 'three'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
// import { XMesh } from '../playground/mesh'
// import { usePlaygroundStore } from '../playground/state/store'
// import { useShallow } from 'zustand/shallow'
// import { useXRInputSourceEvent } from '@react-three/xr'
// import ControllerDistanceScaler from './ControllerDistanceScaler'
// import { useEffect } from 'react'



// const store = createXRStore({
//   controller: {
//     left: { rayPointer: { rayModel: { color: 'black' } } },
//     right: { rayPointer: { rayModel: { color: 'black' } } },
//   },
//   enterGrantedSession: true,
//   screenInput: true,
//   handTracking: false,
//   hitTest: true,
//   planeDetection: false,
//   anchors: true,
//   gaze: false,
//   domOverlay: true,
//   originReferenceSpace: 'local-floor',
//   bounded: false,
//   foveation: 0, 
//   emulate: { syntheticEnvironment: false }
// })


// function useRoundedPlane(width = 0.4, height = 0.2, radius = 0.05) {
//   return useMemo(() => {
//     const shape = new THREE.Shape()
//     const w = width / 2, h = height / 2
//     shape.moveTo(-w + radius, -h)
//     shape.lineTo(w - radius, -h)
//     shape.quadraticCurveTo(w, -h, w, -h + radius)
//     shape.lineTo(w, h - radius)
//     shape.quadraticCurveTo(w, h, w - radius, h)
//     shape.lineTo(-w + radius, h)
//     shape.quadraticCurveTo(-w, h, -w, h - radius)
//     shape.lineTo(-w, -h + radius)
//     shape.quadraticCurveTo(-w, -h, -w + radius, -h)
//     return new THREE.ShapeGeometry(shape)
//   }, [width, height, radius])
// }

// type DraggableProps = {
//   children: React.ReactNode;
//   position?: [number, number, number];
// };

// // function Draggable({ children, position = [0, 0, 0] }: DraggableProps) {
// //   const ref = useRef<THREE.Group>(null)
// //   const { controller } = useXR()
// //   const [grabbed, setGrabbed] = useState<'left' | 'right' | null>(null)

// //   const handleStart = (event: any) => {
// //     const id = event.controller
// //     if (!ref.current) return
// //     setGrabbed(id)

// //     ref.current.traverse((obj: any) => {
// //       if (obj.isMesh && obj.material?.color) {
// //         if (!obj.userData._originalColor) {
// //           obj.userData._originalColor = obj.material.color.getHex()
// //         }
// //         obj.material.color.set('#3399ff')
// //       }
// //     })
// //   }

// //   const handleEnd = (event: any) => {
// //     if (event.controller === grabbed) {
// //       setGrabbed(null)
// //       ref.current?.traverse((obj: any) => {
// //         if (obj.isMesh && obj.material?.color && obj.userData._originalColor) {
// //           obj.material.color.setHex(obj.userData._originalColor)
// //           delete obj.userData._originalColor
// //         }
// //       })
// //     }
// //   }

// //   useFrame(() => {
// //     if (grabbed && ref.current) {
// //       const ctrl = controller(grabbed)
// //       if (ctrl) {
// //         ref.current.position.copy(ctrl.position)
// //         ref.current.quaternion.copy(ctrl.quaternion)
// //       }
// //     }
// //   })

// //   return (
// //     <Interactive onSelectStart={handleStart} onSelectEnd={handleEnd}>
// //       <group ref={ref} position={position}>
// //         {children}
// //       </group>
// //     </Interactive>
// //   )
// // }


// function ScaleButtons({ onScaleChange }: { onScaleChange: (factor: number) => void }) {
//   const buttonGeometry = useRoundedPlane(0.2, 0.1, 0.02)

//   return (
//     <>
//       <Interactive onSelect={() => onScaleChange(1.1)}>
//         <mesh position={[-0.6, 1.5, -1]} geometry={buttonGeometry}>
//           <meshStandardMaterial color="green" />
//           <Text position={[0, 0, 0.01]} fontSize={0.05} anchorX="center" anchorY="middle" color="white">+</Text>
//         </mesh>
//       </Interactive>

//       <Interactive onSelect={() => onScaleChange(0.9)}>
//         <mesh position={[-0.6, 1.3, -1]} geometry={buttonGeometry}>
//           <meshStandardMaterial color="red" />
//           <Text position={[0, 0, 0.01]} fontSize={0.05} anchorX="center" anchorY="middle" color="white">-</Text>
//         </mesh>
//       </Interactive>
//     </>
//   )
// }



// function Draggable({ children, position = [0, 0, 0] }: DraggableProps) {
//   const ref = useRef<THREE.Group>(null)
//   const { controller } = useXR()
//   const [grabbed, setGrabbed] = useState<'left' | 'right' | null>(null)
//   const isDragging = useRef(false)

//   // XR 控制器抓取回调
//   const handleStart = (e: any) => {
//     const id = e.controller
//     if (!ref.current) return
//     setGrabbed(id)
//     isDragging.current = true
//   }
//   const handleEnd = (e: any) => {
//     if (e.controller === grabbed) {
//       setGrabbed(null)
//       isDragging.current = false
//     }
//   }

//   // 鼠标拖拽事件逻辑
//   const onPointerDown = (e: any) => {
//     isDragging.current = true
//     ref.current!.setPointerCapture(e.pointerId)
//   }
//   const onPointerMove = (e: any) => {
//     if (!isDragging.current) return
//     ref.current!.position.copy(e.point)
//   }
//   const onPointerUp = (e: any) => {
//     isDragging.current = false
//     ref.current!.releasePointerCapture(e.pointerId)
//   }

//   useFrame(() => {
//     if (grabbed && ref.current) {
//       const ctrl = controller(grabbed)
//       if (ctrl) {
//         ref.current.position.copy(ctrl.position)
//         ref.current.quaternion.copy(ctrl.quaternion)
//       }
//     }
//   })

//   return (
//     <Interactive onSelectStart={handleStart} onSelectEnd={handleEnd}>
//       <group
//         ref={ref}
//         position={position}
//         onPointerDown={onPointerDown}
//         onPointerMove={onPointerMove}
//         onPointerUp={onPointerUp}
//       >
//         {children}
//       </group>
//     </Interactive>
//   )
// }



// function ControllerDebugLines() {
//   const leftRef = useRef<THREE.ArrowHelper>(null)
//   const rightRef = useRef<THREE.ArrowHelper>(null)
//   const { controller } = useXR()
//   useFrame(() => {
//     const left = controller('left'), right = controller('right')
//     if (left && leftRef.current) {
//       leftRef.current.position.copy(left.position)
//       leftRef.current.setDirection(new THREE.Vector3(0,0,-1).applyQuaternion(left.quaternion))
//     }
//     if (right && rightRef.current) {
//       rightRef.current.position.copy(right.position)
//       rightRef.current.setDirection(new THREE.Vector3(0,0,-1).applyQuaternion(right.quaternion))
//     }
//   })
//   return (
//     <>
//       <arrowHelper ref={leftRef} args={[new THREE.Vector3(0,0,-1), new THREE.Vector3(), 0.3, 0xff0000]} />
//       <arrowHelper ref={rightRef} args={[new THREE.Vector3(0,0,-1), new THREE.Vector3(), 0.3, 0x0000ff]} />
//     </>
//   )
// }



// function GeneratedModel() {
//   const gltf = useLoader(GLTFLoader, '/models/mesh1.glb')
//   const modelRef = useRef<THREE.Group>(null)
//   const [scale, setScale] = useState(1)

//   const handleScaleChange = (factor: number) => {
//     setScale(prev => Math.max(0.1, Math.min(prev * factor, 5))) // 限制在 [0.1, 5]
//   }

//   return (
//     <>
//       <Draggable position={[0, 1.0, -1]}>
//         <group ref={modelRef} scale={[scale, scale, scale]}>
//           <primitive object={gltf.scene} />
//         </group>
//       </Draggable>
//       <ScaleButtons onScaleChange={handleScaleChange} />
//     </>
//   )
// }



// function UploadedImage({ imageUrl }: { imageUrl: string | null }) {
//   const texture = useLoader(THREE.TextureLoader, imageUrl || '/placeholder.png')

//   if (!imageUrl || !texture.image) return null

//   const aspectRatio = texture.image.width / texture.image.height
//   const height = 0.6
//   const width = height * aspectRatio

//   return (
//     <Draggable position={[1.2, 1.3, -1]}>
//       <mesh>
//         <planeGeometry args={[width, height]} />
//         <meshBasicMaterial map={texture} toneMapped={false} />
//       </mesh>
//     </Draggable>
//   )
// }



// export default function XRPlayground() {
//   //const [toggled, setToggled] = useState(false)
//   const [imageUrl, setImageUrl] = useState<string | null>(null)
//   const [showModel, setShowModel] = useState(false)
//   const [pressedBtn, setPressedBtn] = useState<'upload' | 'generate' | null>(null)
//   const roundedPlane = useRoundedPlane()
//   const uploadInputRef = useRef<HTMLInputElement>(null)
//   const playground = usePlaygroundStore(useShallow(state => ({
//     meshes: state.meshes,
//   })))

//   useEffect(() => {
//     const canvas = document.querySelector('canvas')
//     if (!canvas) return
//     const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
//     renderer.xr.enabled = true
//   }, [])
  
//   const handleUpload = () => {
//     setPressedBtn('upload')
//     setTimeout(() => setPressedBtn(null), 150)
//     uploadInputRef.current?.click()
//   }

//   const handleGenerate = () => {
//     setPressedBtn('generate')
//     setShowModel(true)
//     setTimeout(() => setPressedBtn(null), 150)
//   }

//     const onFile = (e: any) => {
//     const f = e.target.files?.[0]
//     if (f) setImageUrl(URL.createObjectURL(f))
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       setImageUrl(URL.createObjectURL(file))
//     }
//   }

//   return (
//     <>
//       <button
//         onClick={() => {
//           store.enterAR({
//             requiredFeatures: ['hit-test'],
//             optionalFeatures: ['local-floor', 'dom-overlay'],
//             mode: 'immersive-ar',
//           })
//         }}
//         style={{ position: 'absolute', top: 20, left: 20, zIndex: 1 }}
//       >
//         {store.session ? 'Exit AR' : 'Enter AR'}
//       </button>
//       <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      
//       <Canvas
//         shadows
//         gl={{ alpha: true }}
//         style={{ background: 'transparent' }}
//       >

//         <XR store={store}>
//           <ambientLight intensity={1} />
//           <directionalLight position={[5, 5, 5]} castShadow />
//           <Environment preset="warehouse" />
//           <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
//             <planeGeometry args={[10, 10]} />
//             <meshStandardMaterial color="rgb(121,121,121)" />
//           </mesh>

//           {/* <mesh geometry={roundedPlane} position={[0, 1.5, -1]} onClick={() => setToggled(prev => !prev)} castShadow>
//             <meshStandardMaterial color={toggled ? [1, 0.5, 0] : [0.5, 0.8, 1]} transparent opacity={0.5} side={2} />
//             <Text position={[0, 0, 0.01]} fontSize={0.05} anchorX="center" anchorY="middle" color="black">
//               {toggled ? 'Toggled' : 'Toggle Me'}
//             </Text>
//           </mesh> */}

//           <mesh geometry={roundedPlane} position={[0.6, 1.5, -1]} onClick={handleUpload} castShadow>
//             <meshStandardMaterial color="black" transparent opacity={pressedBtn === 'upload' ? 0.5 : 0.8} side={2} />
//             <Text position={[0, 0, 0.01]} fontSize={0.06} anchorX="center" anchorY="middle" color="white">Upload</Text>
//           </mesh>

//           <mesh geometry={roundedPlane} position={[0.6, 1.2, -1]} onClick={handleGenerate} castShadow>
//             <meshStandardMaterial color="black" transparent opacity={pressedBtn === 'generate' ? 0.5 : 0.8} side={2} />
//             <Text position={[0, 0, 0.01]} fontSize={0.06} anchorX="center" anchorY="middle" color="white">Generate</Text>
//           </mesh>

//           {/* <mesh geometry={roundedPlane} position={[0.6, 1.5, -1]} onClick={Rotate} castShadow>
//             <meshStandardMaterial color="black" transparent opacity={pressedBtn === 'upload' ? 0.5 : 0.8} side={2} />
//             <Text position={[0, 0, 0.01]} fontSize={0.06} anchorX="center" anchorY="middle" color="white">Rotate</Text>
//           </mesh> */}


//           <UploadedImage imageUrl={imageUrl} />

//           <Suspense fallback={null}>
//             {playground.meshes.map(m => (
//               <Draggable key={m.id} position={m.position.toArray() as [number, number, number]}>
//                 <XMesh mesh={m} autoRotate={false} />
//               </Draggable>
//             ))}
//           </Suspense>

//           {showModel && (
//             <Suspense fallback={null}>
//               <GeneratedModel />
//             </Suspense>
//           )}

//           <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={10} blur={1.5} far={2} />
//           <OrbitControls />
//         </XR>
//       </Canvas>
//     </>
//   )
// }



// import React, { useState, useMemo, useRef, Suspense } from 'react'
// import { Canvas, useLoader } from '@react-three/fiber'
// import { XR, createXRStore } from '@react-three/xr'
// import { Text, Environment, OrbitControls, ContactShadows } from '@react-three/drei'
// import * as THREE from 'three'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'


// // 引入原来项目里的 XMesh 逻辑
// import { XMesh } from '../playground/mesh'       // 根据实际路径调整
// import { meshType } from '../playground/types'
// import { usePlaygroundStore } from '../playground/state/store'
// import { useShallow } from 'zustand/shallow'

// const store = createXRStore({
//   controller: {
//     left: { rayPointer: { rayModel: { color: 'black' } } },
//     right: { rayPointer: { rayModel: { color: 'black' } } },
//   },
// })

// // 圆角平面 geometry 
// function useRoundedPlane(width = 0.4, height = 0.2, radius = 0.05) {
//   return useMemo(() => {
//     const shape = new THREE.Shape()
//     const w = width / 2, h = height / 2
//     shape.moveTo(-w + radius, -h)
//     shape.lineTo(w - radius, -h)
//     shape.quadraticCurveTo(w, -h, w, -h + radius)
//     shape.lineTo(w, h - radius)
//     shape.quadraticCurveTo(w, h, w - radius, h)
//     shape.lineTo(-w + radius, h)
//     shape.quadraticCurveTo(-w, h, -w, h - radius)
//     shape.lineTo(-w, -h + radius)
//     shape.quadraticCurveTo(-w, -h, -w + radius, -h)
//     return new THREE.ShapeGeometry(shape)
//   }, [width, height, radius])
// }

// function GeneratedModel() {
//   const gltf = useLoader(GLTFLoader, '/models/mesh1.glb')
//   return <primitive object={gltf.scene} position={[0, 1.0, -1]} scale={[0.5, 0.5, 0.5]} />
// }


// // 上传的图片预览 Plane
// function UploadedImage({ imageUrl }: { imageUrl: string | null }) {
//   const texture = useLoader(THREE.TextureLoader, imageUrl || '/placeholder.png')
//   if (!imageUrl) return null
//   return (
//     <mesh position={[-0.6, 1.3, -1]} scale={[1.2, 1.2, 1]} castShadow>
//       <planeGeometry args={[0.5, 0.3]} />
//       <meshBasicMaterial map={texture} toneMapped={false} />
//     </mesh>
//   )
// }

// export default function XRButtonScene() {
//   const [toggled, setToggled] = useState(false)
//   const [imageUrl, setImageUrl] = useState<string | null>(null)
//   const [createSphere, setCreateSphere] = useState(false)
//   const [pressedBtn, setPressedBtn] = useState<'upload' | 'generate' | null>(null)

//   const roundedPlane = useRoundedPlane()
//   const uploadInputRef = useRef<HTMLInputElement>(null)
//   const [showModel, setShowModel] = useState(false)

//   const playground = usePlaygroundStore(useShallow(state => ({
//     meshes: state.meshes,
//   })))

//   const handleUpload = () => {
//     setPressedBtn('upload')
//     setTimeout(() => setPressedBtn(null), 150)
//     uploadInputRef.current?.click()
//   }

//   // const handleGenerate = () => {
//   //   setPressedBtn('generate')
//   //   setCreateSphere(true)
//   //   setTimeout(() => setPressedBtn(null), 150)
//   // }
//   const handleGenerate = () => {
//     setPressedBtn('generate')
//     setShowModel(true)
//     setTimeout(() => setPressedBtn(null), 150)
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       setImageUrl(URL.createObjectURL(file))
//     }
//   }

//   return (
//     <>
//       <button onClick={() => store.enterAR()} style={{ position: 'absolute', top: 20, left: 20, zIndex: 1 }}>
//         {store.session ? 'Exit AR' : 'Enter AR'}
//       </button>
//       <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

//       <Canvas shadows>
//         <XR store={store}>
//           <ambientLight intensity={1} />
//           <directionalLight position={[5,5,5]} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024}/>
//           <Environment preset="warehouse" />

//           {/* 地板 */}
//           <mesh rotation={[-Math.PI/2,0,0]} receiveShadow>
//             <planeGeometry args={[10,10]} />
//             <meshStandardMaterial color='rgb(121,121,121)' />
//           </mesh>

//           {/* Toggle 按钮 */}
//           <mesh
//             geometry={roundedPlane}
//             position={[0,1.5,-1]}
//             onClick={() => setToggled(prev => !prev)}
//             castShadow
//           >
//             <meshStandardMaterial color={toggled ? [1,0.5,0] : [0.5,0.8,1]} transparent opacity={0.5} side={2} />
//             <Text position={[0,0,0.01]} fontSize={0.05} anchorX="center" anchorY="middle" color="black">
//               {toggled ? 'Toggled' : 'Toggle Me'}
//             </Text>
//           </mesh>

//           {/* Upload 按钮 */}
//           <mesh
//             geometry={roundedPlane}
//             position={[0.6,1.5,-1]}
//             onClick={handleUpload}
//             castShadow
//           >
//             <meshStandardMaterial color='rgb(0, 0, 0)' transparent opacity={pressedBtn === 'upload' ? 0.5 : 0.8} side={2} />
//             <Text position={[0,0,0.01]} fontSize={0.06} anchorX="center" anchorY="middle" color="white">Upload</Text>
//           </mesh>

//           {/* Generate 按钮 */}
//           <mesh
//             geometry={roundedPlane}
//             position={[0.6,1.2,-1]}
//             onClick={handleGenerate}
//             castShadow
//           >
//             <meshStandardMaterial color='rgb(0, 0, 0)' transparent opacity={pressedBtn === 'generate' ? 0.5 : 0.8} side={2} />
//             <Text position={[0,0,0.01]} fontSize={0.05} anchorX="center" anchorY="middle" color="white">Generate</Text>
//           </mesh>

//           {/* 图片预览 */}
//           <UploadedImage imageUrl={imageUrl} />

//           {/* 在 XR 中加载模型 */}
//           <Suspense fallback={null}>
//             {playground.meshes.map(m => (
//               <XMesh
//                 key={m.id}
//                 mesh={m}
//                 position={m.position.toArray() as [number, number, number]}
//                 autoRotate={false}
//               />
//             ))}
//           </Suspense>

//           {showModel && (
//             <Suspense fallback={null}>
//               <GeneratedModel />
//             </Suspense>
//           )}

//           {/* 生成球体
//           {createSphere && (
//             <mesh position={[0, 1.0, -1]} castShadow>
//               <sphereGeometry args={[0.15, 32, 32]} />
//               <meshStandardMaterial color='orange' />
//             </mesh>
//           )} */}

//           <ContactShadows position={[0,0.01,0]} opacity={0.4} scale={10} blur={1.5} far={2}/>
//           <OrbitControls />
//         </XR>
//       </Canvas>
//     </>
//   )
// }





// //src/xr_playground/index.tsx
// import React, { useState, useMemo, useRef } from 'react'
// import { Canvas, useLoader } from '@react-three/fiber'
// import { XR, createXRStore } from '@react-three/xr'
// import {
//   Text,
//   Environment,
//   OrbitControls,
//   ContactShadows,
// } from '@react-three/drei'
// import * as THREE from 'three'

// const store = createXRStore({
//   controller: {
//     left: { rayPointer: { rayModel: { color: 'black' } } },
//     right: { rayPointer: { rayModel: { color: 'black' } } },
//   },
// })


// // 圆角平面 Geometry hook
// function useRoundedPlane(width = 0.4, height = 0.2, radius = 0.05) {
//   return useMemo(() => {
//     const shape = new THREE.Shape()
//     const w = width / 2
//     const h = height / 2
//     shape.moveTo(-w + radius, -h)
//     shape.lineTo(w - radius, -h)
//     shape.quadraticCurveTo(w, -h, w, -h + radius)
//     shape.lineTo(w, h - radius)
//     shape.quadraticCurveTo(w, h, w - radius, h)
//     shape.lineTo(-w + radius, h)
//     shape.quadraticCurveTo(-w, h, -w, h - radius)
//     shape.lineTo(-w, -h + radius)
//     shape.quadraticCurveTo(-w, -h, -w + radius, -h)
//     return new THREE.ShapeGeometry(shape)
//   }, [width, height, radius])
// }

// // 显示上传图片（使用 hook 顶层）
// function UploadedImage({ imageUrl }: { imageUrl: string | null }) {
//   // 无条件调用 hook，提供默认图片防止报错
//   const texture = useLoader(THREE.TextureLoader, imageUrl || '/placeholder.png')

//   if (!imageUrl) return null

//   return (
//     <mesh position={[1.5, 1.3, -1]} scale={[2, 2, 1]}>
//       <planeGeometry args={[0.5, 0.3]} />
//       <meshBasicMaterial map={texture} toneMapped={false} />
//     </mesh>
//   )
// }

// export default function XRButtonScene() {
//   const [toggled, setToggled] = useState(false)
//   const [imageUrl, setImageUrl] = useState<string | null>(null)
//   const roundedPlane = useRoundedPlane(0.4, 0.2, 0.05)
//   const uploadInputRef = useRef<HTMLInputElement>(null)
//   const [generateClicked, setGenerateClicked] = useState(false)

//   const handleUploadClick = () => {
//     uploadInputRef.current?.click()
//   }

// const handleGenerateClick = () => {
//     setGenerateClicked(true)
//     console.log("Generate triggered")
//     setTimeout(() => setGenerateClicked(false), 300) // 300ms后还原颜色
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       const url = URL.createObjectURL(file)
//       setImageUrl(url)
//       console.log('Uploaded Image URL:', url)
//     }
//   }

//   return (
//     <>
//       <button
//         onClick={() => store.enterAR()}
//         style={{ position: 'absolute', zIndex: 1, top: 20, left: 20 }}
//       >
//         {store.session ? 'Exit AR' : 'Enter AR'}
//       </button>

//       <input
//         ref={uploadInputRef}
//         type="file"
//         accept="image/*"
//         style={{ display: 'none' }}
//         onChange={handleFileChange}
//       />

//       <Canvas shadows>
//         <XR store={store}>
//           <ambientLight intensity={1} />
//           <directionalLight
//             position={[5, 5, 5]}
//             castShadow
//             shadow-mapSize-width={1024}
//             shadow-mapSize-height={1024}
//           />

//           <Environment preset="warehouse" />

//           <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
//             <planeGeometry args={[10, 10]} />
//             <meshStandardMaterial color='rgb(121, 121, 121)' />
//           </mesh>

//           {/* 按钮 1 - Toggle */}
//           <mesh
//             geometry={roundedPlane}
//             position={[0, 1.5, -1]}
//             onClick={() => setToggled((prev) => !prev)}
//             castShadow
//           >
//             <meshStandardMaterial
//               color={toggled ? [1, 0.5, 0] : [0.5, 0.8, 1]}
//               transparent
//               opacity={0.5}
//               side={2}
//             />
//             <Text position={[0, 0, 0.01]} fontSize={0.05} anchorX="center" anchorY="middle" color="black">
//               {toggled ? 'Toggled' : 'Toggle Me'}
//             </Text>
//           </mesh>

//           {/* 按钮 2 - Upload */}
//           <mesh
//             geometry={roundedPlane}
//             position={[0.6, 1.5, -1]}
//             onClick={handleUploadClick}
//             castShadow
//           >
//             <meshStandardMaterial
//               color={'rgb(66, 201, 179)'}
//               transparent
//               opacity={0.8}
//               side={2}
//             />
//             <Text 
//               position={[0, 0, 0.01]} 
//               fontSize={0.05} 
//               anchorX="center" 
//               anchorY="middle" 
//               color="black">
//               Upload
//             </Text>
//           </mesh>

//           {/* 按钮 3 - Generate */}
//           <mesh
//             geometry={roundedPlane}
//             position={[0.6, 1.24, -1]}
//             onClick={handleUploadClick}
//             castShadow
//           >
//             <meshStandardMaterial
//               color={'rgb(66, 201, 179)'}
//               transparent
//               opacity={generateClicked ? 0.4 : 0.8} 
//               side={2}
//             />
//             <Text 
//               position={[0, 0, 0.01]} 
//               fontSize={0.05} 
//               anchorX="center" 
//               anchorY="middle" 
//               color="black">
//               Generate
//             </Text>
//           </mesh>

//           {/* 显示上传图片 */}
//           <UploadedImage imageUrl={imageUrl} />

//           <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={10} blur={1.5} far={2} />
//           <OrbitControls />
//         </XR>
//       </Canvas>
//     </>
//   )
// }

// // custom imports

// // static data

// // third party

// // css stylesheets
// import '../assets/css/xr_playground.css'

// type XRPlaygroundProps = JSX.IntrinsicElements["div"] & {
// }

// export default function XRPlayground(props: XRPlaygroundProps) {
//     // TODO: setup your xrplaygroundstate selector here 
    
//     return (
//         <div id="canvas-container" className='height-100'>
//             {/*** 
//                 You may want to create a component similar to XCanvas in playground that you can import here. 
//                 check out https://github.com/pmndrs/xr but feel free to use plain webxr :) 

//                 Checkout utils.ts for useful common functions.
//                 components/ has some useful components like loading, modal, dropdown, etc. 
//             ***/}
//         </div>
//     )
// }



// //xrplayground/index.tsx
// import { useEffect, useState } from 'react';
// import { Canvas } from '@react-three/fiber';
// import { XR, createXRStore } from '@react-three/xr';
// import XRCanvas from './XRCanvas';
// import { uploadMesh, initMesh } from './api';

// export default function XRPlayground() {
//   const [store, setStore] = useState<any>(null);
//   const [shape, setShape] = useState<'cube' | 'sphere'>('cube');
//   const [uploadedUrl, setUploadedUrl] = useState<string | undefined>(undefined);


//   useEffect(() => {
//     const overlayRoot = document.getElementById('overlay');
//     const button = document.getElementById('overlay-button');

//     if (!overlayRoot || !button) return;

//     const newStore = createXRStore({
//       emulate: 'metaQuest3',
//       sessionInit: {
//         optionalFeatures: ['dom-overlay'],
//         domOverlay: { root: overlayRoot },
//       },
//     });

//     setStore(newStore);

//     button.innerText = 'Switch to Sphere';
//     button.addEventListener('click', () => {
//       setShape((prev) => {
//         const next = prev === 'cube' ? 'sphere' : 'cube';
//         button.innerText = next === 'cube' ? 'Switch to Sphere' : 'Switch to Cube';
//         return next;
//       });
//     });

//     // 监听上传的图片 URL

//     const handleImageUpload = (e: Event) => {
//       const url = (e as CustomEvent).detail;
//       setUploadedUrl(url);
//     };
//     window.addEventListener('image-uploaded', handleImageUpload);

//     return () => {
//       window.removeEventListener('image-uploaded', handleImageUpload);
//     };
//   }, []);

//   if (!store) return null;

//   return (
//     <div style={{ height: '100%' }}>
//       <Canvas shadows camera={{ position: [0, 1.6, 4], fov: 70 }} onCreated={({ gl }) => { gl.xr.enabled = true }}>
//         <XR store={store}>
//           <XRCanvas uploadedUrl={uploadedUrl} shape={shape} />
//         </XR>
//       </Canvas>
//     </div>
//   );
// }

// // // xr_playground/index.tsx
// // import { useEffect, useState } from 'react'
// // import { Canvas } from '@react-three/fiber'
// // import { XR, createXRStore } from '@react-three/xr'
// // import XRCanvas from './XRCanvas'
// // import { uploadMesh, initMesh } from './api'
// // import { usePlaygroundStore } from '../playground/state/store'

// // export default function XRPlayground() {
// //   const [store, setStore] = useState<any>(null)
// //   const [shape, setShape] = useState<'cube'|'sphere'>('cube')

// //   const addMesh = usePlaygroundStore(state => state.addMesh)

// //   useEffect(() => {
// //     const overlay = document.getElementById('overlay')
// //     const switchBtn = document.getElementById('overlay-button')
// //     const meshInput = document.createElement('input')
// //     meshInput.type = 'file'
// //     meshInput.accept = '.glb,.obj'
// //     meshInput.style.display = 'none'
// //     document.body.appendChild(meshInput)

// //     if (!overlay || !switchBtn) return

// //     const xrstore = createXRStore({
// //       emulate: 'metaQuest3',
// //       sessionInit: {
// //         optionalFeatures: ['dom-overlay'],
// //         domOverlay: { root: overlay }
// //       }
// //     })
// //     setStore(xrstore)

// //     switchBtn.innerText = 'Switch to Sphere'
// //     switchBtn.addEventListener('click', () => {
// //       setShape(prev => { const next = prev==='cube'? 'sphere':'cube'; switchBtn.innerText = next === 'cube' ? 'Switch to Sphere' : 'Switch to Cube'; return next})
// //     })

// //     meshInput.addEventListener('change', async e => {
// //       const file = (e.target as HTMLInputElement).files?.[0]
// //       if (!file) return
// //       try {
// //         const pid = window.currentPlaygroundId || 'test-id'
// //         await uploadMesh(pid, file)
// //         const mesh = await initMesh(file.name) // 或者后端返回新ID
// //         addMesh(mesh)
// //         console.log('✅ Mesh uploaded & loaded')
// //       } catch(err) {
// //         console.error('❌ Upload/init failed', err)
// //       }
// //     })

// //     // Create another DOM button for upload
// //     const uploadBtn = document.createElement('button')
// //     uploadBtn.innerText = 'Upload Mesh'
// //     uploadBtn.style.pointerEvents = 'auto'
// //     uploadBtn.style.background = 'rgba(80,150,255,0.85)'
// //     uploadBtn.style.color = 'white'
// //     uploadBtn.style.padding = '8px 12px'
// //     uploadBtn.style.borderRadius = '6px'
// //     uploadBtn.style.marginLeft = '8px'
// //     overlay.appendChild(uploadBtn)
// //     uploadBtn.addEventListener('click', () => meshInput.click())

// //     return () => {
// //       switchBtn.removeEventListener('click', ()=>{})
// //       meshInput.remove()
// //       uploadBtn.remove()
// //     }
// //   }, [addMesh])

// //   if (!store) return null

// //   return (
// //     <Canvas shadows camera={{ position:[0,1.6,4], fov:70 }} onCreated={({gl})=>gl.xr.enabled=true}>
// //       <XR store={store}>
// //         <XRCanvas shape={shape} />
// //       </XR>
// //     </Canvas>
// //   )
// // }
// XRPlayground.tsx
// import React, { useState } from 'react'
// import { Canvas } from '@react-three/fiber'
// import { XR, createXRStore } from '@react-three/xr'
// import { Text, Environment, OrbitControls, ContactShadows } from '@react-three/drei'

// const store = createXRStore()

// export default function XRButtonScene() {
//   const [toggled, setToggled] = useState(false)

//   return (
//     <>
//       {/* 进入 VR */}
//       <button
//         onClick={() => store.enterVR()}
//         style={{ position: 'absolute', zIndex: 1, top: 20, left: 20 }}
//       >
//         {store.session ? '退出 VR' : '进入 VR'}
//       </button>

//       <Canvas shadows>
//         <XR store={store}>
//           {/* 环境光与方向光 */}
//           <ambientLight intensity={0.5} />
//           <directionalLight position={[5, 5, 5]} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />

//           {/* 背景环境贴图 */}
//           <Environment preset="warehouse" />

//           {/* 地板 */}
//           <mesh
//             rotation={[-Math.PI / 2, 0, 0]}
//             receiveShadow
//             position={[0, 0, 0]}
//           >
//             <planeGeometry args={[10, 10]} />
//             <meshStandardMaterial color="#e0e0e0" />
//           </mesh>

//           {/* 按钮 Mesh */}
//           {/* <mesh
//             position={[0, 1.5, -1]}
//             onClick={() => setToggled(prev => !prev)}
//             castShadow
//           >
//             <boxGeometry args={[0.3, 0.15, 0.05]} />
//             <meshStandardMaterial color={toggled ? 'orange' : 'skyblue'} />
//             <Text position={[0, 0, 0.03]} fontSize={0.05} anchorX="center" anchorY="middle">
//               {toggled ? 'Toggled' : 'Toggle Me'}
//             </Text>
//           </mesh> */}
//           {/* 按钮 Mesh - 改为半透明平面 */}
//             <mesh
//             position={[0, 1.5, -1]}
//             onClick={() => setToggled(prev => !prev)}
//             >
//             <planeGeometry args={[0.4, 0.2]} />
//             <meshStandardMaterial
//                 color={toggled ? [1, 0.5, 0] : [0.5, 0.8, 1]}
//                 transparent
//                 opacity={0.5}
//                 side={2} // double-sided
//             />
//             <Text
//                 position={[0, 0, 0.01]}
//                 fontSize={0.05}
//                 anchorX="center"
//                 anchorY="middle"
//             >
//                 {toggled ? 'Toggled' : 'Toggle Me'}
//             </Text>
//             </mesh>


//           {/* 柔和接触阴影 */}
//           <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={10} blur={1.5} far={2} />

//           {/* 鼠标测试用控制器（非 VR 模式） */}
//           <OrbitControls />
//         </XR>
//       </Canvas>
//     </>
//   )
// }
// import React, { useState, useMemo, useRef } from 'react'
// import { Canvas } from '@react-three/fiber'
// import { XR, createXRStore } from '@react-three/xr'
// import { Text, Environment, OrbitControls, ContactShadows } from '@react-three/drei'
// import { useLoader } from '@react-three/fiber'

// import * as THREE from 'three'

// const store = createXRStore()

// // 圆角平面 Geometry hook
// function useRoundedPlane(width = 0.4, height = 0.2, radius = 0.05) {
//   return useMemo(() => {
//     const shape = new THREE.Shape()
//     const w = width / 2
//     const h = height / 2
//     shape.moveTo(-w + radius, -h)
//     shape.lineTo(w - radius, -h)
//     shape.quadraticCurveTo(w, -h, w, -h + radius)
//     shape.lineTo(w, h - radius)
//     shape.quadraticCurveTo(w, h, w - radius, h)
//     shape.lineTo(-w + radius, h)
//     shape.quadraticCurveTo(-w, h, -w, h - radius)
//     shape.lineTo(-w, -h + radius)
//     shape.quadraticCurveTo(-w, -h, -w + radius, -h)
//     return new THREE.ShapeGeometry(shape)
//   }, [width, height, radius])
// }

// // ✅ 仅在 imageUrl 存在时加载贴图
// function UploadedImage({ imageUrl }: { imageUrl: string | null }) {
//   if (!imageUrl) return null
//   const texture = useLoader(THREE.TextureLoader, imageUrl)

//   return (
//     <mesh position={[-0.6, 1.5, -1]} scale={[1.2, 1.2, 1]}>
//       <planeGeometry args={[0.5, 0.3]} />
//       <meshBasicMaterial map={texture} toneMapped={false} />
//     </mesh>
//   )
// }

// export default function XRButtonScene() {
//   const [toggled, setToggled] = useState(false)
//   const [imageUrl, setImageUrl] = useState<string | null>(null)
//   const roundedPlane = useRoundedPlane(0.4, 0.2, 0.05)
//   const uploadInputRef = useRef<HTMLInputElement>(null)

//   const handleUploadClick = () => {
//     uploadInputRef.current?.click()
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       const url = URL.createObjectURL(file)
//       setImageUrl(url)
//       console.log('Uploaded Image URL:', url)
//     }
//   }

//   return (
//     <>
//       <button
//         onClick={() => store.enterAR()}
//         style={{ position: 'absolute', zIndex: 1, top: 20, left: 20 }}
//       >
//         {store.session ? 'Exit AR' : 'Enter AR'}
//       </button>

//       <input
//         ref={uploadInputRef}
//         type="file"
//         accept="image/*"
//         style={{ display: 'none' }}
//         onChange={handleFileChange}
//       />

//       <Canvas shadows>
//         <XR store={store}>
//           <ambientLight intensity={1} />
//           <directionalLight
//             position={[5, 5, 5]}
//             castShadow
//             shadow-mapSize-width={1024}
//             shadow-mapSize-height={1024}
//           />

//           <Environment preset="warehouse" />

//           <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
//             <planeGeometry args={[10, 10]} />
//             <meshStandardMaterial color="#e0e0e0" />
//           </mesh>

//           {/* 按钮 1 - Toggle */}
//           <mesh
//             geometry={roundedPlane}
//             position={[0, 1.5, -1]}
//             onClick={() => setToggled(prev => !prev)}
//             castShadow
//           >
//             <meshStandardMaterial
//               color={toggled ? 'rgb(0, 0, 255)' : 'rgb(0, 0, 255)' }
//               transparent
//               opacity={0.5}
//               side={2}
//             />
//             <Text position={[0, 0, 0.01]} fontSize={0.05} anchorX="center" anchorY="middle">
//               {toggled ? 'Toggled' : 'Toggle Me'}
//             </Text>
//           </mesh>

//           {/* 按钮 2 - Upload */}
//           <mesh
//             geometry={roundedPlane}
//             position={[0.6, 1.5, -1]}
//             onClick={handleUploadClick}
//             castShadow
//           >
//             <meshStandardMaterial
//               color={[0.3, 0.9, 0.6]}
//               transparent
//               opacity={0.5}
//               side={2}
//             />
//             <Text position={[0, 0, 0.01]} fontSize={0.05} anchorX="center" anchorY="middle">
//               Upload
//             </Text>
//           </mesh>

//           {/* 显示上传图片（延迟贴图加载） */}
//           <UploadedImage imageUrl={imageUrl} />

//           <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={10} blur={1.5} far={2} />
//           <OrbitControls />
//         </XR>
//       </Canvas>
//     </>
//   )
// }


//这是一个不成功的uikit xr版本，进入XR模式后看不到UI，但先存着
// // src/xr_playground/index.tsx
// import React, { useState } from 'react'
// import { Canvas } from '@react-three/fiber'
// import { XR, createXRStore } from '@react-three/xr'
// import { OrbitControls, Environment } from '@react-three/drei'

// import { Root, Container, Text } from '@react-three/uikit'
// import { Button, Defaults } from '@react-three/uikit-apfel'
// import { SquareDashed } from '@react-three/uikit-lucide'

// const store = createXRStore({
//   controller: {
//     left: { rayPointer: { rayModel: { color: 'red' } } },
//     right: { rayPointer: { rayModel: { color: 'red' } } },
//   },
// })

// export default function XRButtonScene() {
//   const [toggled, setToggled] = useState(false)

//   return (
//     <>
//       {/* 2D UI 按钮启动 XR 模式 */}
//       <button
//         onClick={() => store.enterAR()}
//         style={{ position: 'absolute', zIndex: 10, top: 20, left: 20 }}
//       >
//         Enter AR
//       </button>

//       <Canvas style={{ position: 'absolute', inset: '0', touchAction: 'none' }} shadows>
//         <XR store={store}>
//           <ambientLight intensity={0.5} />
//           <directionalLight position={[5, 5, 5]} intensity={1} />
//           <Environment preset="warehouse" />
//           <OrbitControls />

//           {/* UIKit 面板 */}
//           <Defaults>
//             <Root
//               position={[0, 1.5, -1]} // 面板在用户面前
//               sizeX={0.5}
//               sizeY={0.3}
//               backgroundColor="black"
//               hover={{ backgroundColor: 'red' }}
//               active={{ backgroundColor: 'green' }}
//             >
//               <Container flexDirection="column" gapRow={12} alignItems="center">
//                 <Button variant="icon" size="xs">
//                   <SquareDashed />
//                 </Button>
//                 <Button variant="rect" size="sm" onClick={() => setToggled(b => !b)}>
//                   <Text color="white">{toggled ? '按钮开' : '按钮关'}</Text>
//                 </Button>
//               </Container>
//             </Root>
//           </Defaults>
//         </XR>
//       </Canvas>
//     </>
//   )
// }
