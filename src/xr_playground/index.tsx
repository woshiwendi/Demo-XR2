// src/xr_playground/index.tsx
import React, { useState, useMemo, useRef, useEffect, forwardRef, RefObject } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import {
  XR,
  XROrigin,
  createXRStore,
  useXR,
  PointerEvents,
  noEvents,
  Interactive,
  useXRInputSourceEvent
} from '@react-three/xr'
import { Environment, ContactShadows, OrbitControls, Text } from '@react-three/drei'
import {
  Root,
  Defaults,
  DefaultProperties,
  Container,
  Text as UIKitText,
  setPreferredColorScheme,
  ComponentInternals,
  MetalMaterial,
  GlassMaterial
} from '@react-three/uikit'
import { Button, colors, Slider } from '@react-three/uikit-default'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PlayIcon,
  MenuIcon,
  ExpandIcon,
  ConstructionIcon,
  ListIcon,
  HeartIcon,
  BackpackIcon
} from '@react-three/uikit-lucide'
import { Handle, HandleTarget, OrbitHandles, HandleStore } from '@react-three/handle'
import * as THREE from 'three'
import { clamp, damp } from 'three/src/math/MathUtils.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { XMesh } from '../playground/mesh'
import { usePlaygroundStore } from '../playground/state/store'
import { useShallow } from 'zustand/shallow'
import ControllerDistanceScaler from './ControllerDistanceScaler'

// —————————————————————————————
// 🛠 XR Store & Material Setup
setPreferredColorScheme('dark')
const store = createXRStore({ foveation: 0, emulate: { syntheticEnvironment: false } })

// —————————————————————————————
// ✅ Utility: rounded-plane geometry
function useRoundedPlane(w = 0.4, h = 0.2, r = 0.05) {
  return useMemo(() => {
    const shape = new THREE.Shape()
    const halfW = w / 2, halfH = h / 2
    shape.moveTo(-halfW + r, -halfH)
    shape.lineTo(halfW - r, -halfH)
    shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + r)
    shape.lineTo(halfW, halfH - r)
    shape.quadraticCurveTo(halfW, halfH, halfW - r, halfH)
    shape.lineTo(-halfW + r, halfH)
    shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r)
    shape.lineTo(-halfW, -halfH + r)
    shape.quadraticCurveTo(-halfW, -halfH, -halfW + r, -halfH)
    return new THREE.ShapeGeometry(shape)
  }, [w, h, r])
}

// —————————————————————————————
// 🔧 Draggable for XR + pointer
function Draggable({ children, position = [0, 0, 0] }) {
  const ref = useRef<THREE.Group>(null)
  const { controller } = useXR()
  const [grabbed, setGrabbed] = useState<'left' | 'right' | null>(null)
  const isDragging = useRef(false)

  useXRInputSourceEvent('selectstart', e => {
    if (e.controller === 'left' || e.controller === 'right') {
      setGrabbed(e.controller)
      isDragging.current = true
    }
  })

  useXRInputSourceEvent('selectend', e => {
    if (e.controller === grabbed) {
      setGrabbed(null)
      isDragging.current = false
    }
  })

  function onPointerDown(e: any) {
    isDragging.current = true
    ref.current!.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: any) {
    if (!isDragging.current) return
    ref.current!.position.copy(e.point)
  }
  function onPointerUp(e: any) {
    isDragging.current = false
    ref.current!.releasePointerCapture(e.pointerId)
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
    <Interactive onSelectStart={() => {}} onSelectEnd={() => {}}>
      <group
        ref={ref}
        position={position}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {children}
      </group>
    </Interactive>
  )
}

// —————————————————————————————
// 🔄 GeneratedModel + ScaleButtons
function ScaleButtons({ onScaleChange }) {
  const geo = useRoundedPlane(0.2, 0.1, 0.02)
  return (
    <>
      <Interactive onSelect={() => onScaleChange(1.1)}>
        <mesh position={[-0.6, 1.5, -1]} geometry={geo}>
          <meshStandardMaterial color="green" />
          <Text position={[0, 0, 0.01]} fontSize={0.05} anchorX="center" anchorY="middle" color="white">+</Text>
        </mesh>
      </Interactive>
      <Interactive onSelect={() => onScaleChange(0.9)}>
        <mesh position={[-0.6, 1.3, -1]} geometry={geo}>
          <meshStandardMaterial color="red" />
          <Text position={[0, 0, 0.01]} fontSize={0.05} anchorX="center" anchorY="middle" color="white">‑</Text>
        </mesh>
      </Interactive>
    </>
  )
}

function GeneratedModel() {
  const gltf = useLoader(GLTFLoader, '/models/mesh1.glb')
  const ref = useRef<THREE.Group>(null)
  const [scale, setScale] = useState(1)
  return (
    <>
      <Draggable position={[0, 1, -1]}>
        <group ref={ref} scale={[scale, scale, scale]}>
          <primitive object={gltf.scene} />
        </group>
      </Draggable>
      <ScaleButtons onScaleChange={s => setScale(prev => clamp(prev * s, 0.1, 5))} />
    </>
  )
}

// —————————————————————————————
// 🖼 UploadedImage
function UploadedImage({ imageUrl }) {
  const tex = useLoader(THREE.TextureLoader, imageUrl || '/placeholder.png')
  if (!imageUrl || !tex.image) return null
  const ar = tex.image.width / tex.image.height
  const h = 0.6, w = ar * h
  return (
    <Draggable position={[1.2, 1.3, -1]}>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </Draggable>
  )
}

// —————————————————————————————
// 🎧 MusicPlayer: replicate official UIKit format
const eulerH = new THREE.Euler()
const quatH = new THREE.Quaternion()
const tmp1 = new THREE.Vector3()
const tmp2 = new THREE.Vector3()
const zAxis = new THREE.Vector3(0, 0, 1)

function MusicPlayer() {
  const ref = useRef<THREE.Group>(null)
  const storeRef = useRef<HandleStore>(null)

  const height = useMemo(() => new THREE.Signal(450), [])
  const width = useMemo(() => new THREE.Signal(700), [])
  const menuWidth = useMemo(() => new THREE.Signal(200), [])
  const showSide = useMemo(() => new THREE.Signal(width.value > 500), [width])
  const sideDisplay = useMemo(() => showSide.value ? 'flex' : 'none', [showSide])

  useFrame((st, dt) => {
    if (!ref.current) return
    st.camera.getWorldPosition(tmp1)
    ref.current.getWorldPosition(tmp2)
    quatH.setFromUnitVectors(zAxis, tmp1.sub(tmp2).normalize())
    eulerH.setFromQuaternion(quatH, 'YXZ')
    ref.current.rotation.y = damp(ref.current.rotation.y, eulerH.y, 10, dt)
  })

  return (
    <group position-y={-0.3}>
      <HandleTarget>
        <group ref={ref} pointerEventsType={{ deny: 'grab' }}>
          <DefaultProperties borderColor={colors.background}>
            <Defaults>
              <Root anchorY="bottom" width={width} height={height} pixelSize={0.0015}>
                <Handle
                  translate="as-scale"
                  targetRef={ref}
                  apply={st => {
                    if (st.first) {
                      width.value = width.value
                    } else {
                      width.value = clamp(width.value * st.current.scale.x, 300, 1000)
                      height.value = clamp(height.value * st.current.scale.y, 250, 700)
                    }
                  }}
                  handleRef={storeRef}
                  rotate={false}
                  multitouch={false}
                >
                  <Container width={26} height={26} backgroundColor={colors.background} panelMaterialClass={GlassMaterial} borderRadius={100} positionRight={-26} positionTop={-26} />
                </Handle>
                <Container flexDirection="column-reverse" flexGrow={1} alignItems="center" gapRow={8}>
                  <Container backgroundColor={colors.background} panelMaterialClass={MetalMaterial} borderRadius={16} padding={8} flexDirection="row" alignItems="center" gapColumn={16} width="90%">
                    <MenuIcon /><UIKitText>Music Player</UIKitText><ExpandIcon /><ConstructionIcon />
                  </Container>
                  <Container flexDirection="row" flexGrow={1}>
                    <Container display={sideDisplay} width={menuWidth.value} backgroundColor="#555555" panelMaterialClass={GlassMaterial} padding={16}>
                      <ListIcon /><UIKitText>Playlists</UIKitText><HeartIcon /><UIKitText>Favorites</UIKitText><BackpackIcon /><UIKitText>History</UIKitText>
                    </Container>
                    <Container backgroundColor={colors.background} panelMaterialClass={GlassMaterial} flexGrow={1} paddingLeft={showSide.value ? 20 : 0}>
                      <Container padding={32} gapRow={16}>
                        <UIKitText>Blowin' in the Wind</UIKitText>
                        <Slider />
                        <Container flexDirection="row" justifyContent="space-around">
                          <Button><ArrowLeftIcon /></Button>
                          <Button><PlayIcon /></Button>
                          <Button><ArrowRightIcon /></Button>
                        </Container>
                      </Container>
                    </Container>
                  </Container>
                </Container>
              </Root>
            </Defaults>
          </DefaultProperties>
        </group>
      </HandleTarget>
    </group>
  )
}

// —————————————————————————————
// ✅ Final App Component
export default function XRPlayground() {
  const [imageUrl, setImageUrl] = useState(null)
  const [showModel, setShowModel] = useState(false)
  const [pressed, setPressed] = useState<'upload'|'generate'|null>(null)
  const playground = usePlaygroundStore(useShallow(s => ({ meshes: s.meshes })))

  const planeGeo = useRoundedPlane()

  function handleUpload() {
    setPressed('upload'); setTimeout(() => setPressed(null), 150)
    document.getElementById('uploadInput')?.click()
  }
  function handleGenerate() {
    setPressed('generate'); setShowModel(true); setTimeout(() => setPressed(null), 150)
  }
  function onFile(e) { if(e.target.files?.[0]) setImageUrl(URL.createObjectURL(e.target.files[0])) }

  return (
    <>
      <input id="uploadInput" type="file" accept="image/*" onChange={onFile} style={{ display:'none' }} />

      <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', zIndex:99 }}>
        <button onClick={()=>store.enterAR()} style={{padding:12}}>Enter AR</button>
        <button onClick={()=>store.enterVR()} style={{padding:12}}>Enter VR</button>
      </div>

      <Canvas events={noEvents} gl={{ localClippingEnabled:true }} camera={{ position:[0,0,0.65] }}>
        <PointerEvents />
        <OrbitHandles />
        <XR store={store}>
          <Environment blur={0.2} background environmentIntensity={2} preset="city" />
          <XROrigin position-y={-1.5} position-z={0.5}>
            <MusicPlayer />
            <mesh geometry={planeGeo} position={[0.6,1.5,-1]} onClick={handleUpload}>
              <meshStandardMaterial color="black" transparent opacity={pressed==='upload'?0.5:0.8}/>
              <Text position={[0,0,0.01]} fontSize={0.06} color="white">Upload</Text>
            </mesh>
            <mesh geometry={planeGeo} position={[0.6,1.2,-1]} onClick={handleGenerate}>
              <meshStandardMaterial color="black" transparent opacity={pressed==='generate'?0.5:0.8}/>
              <Text position={[0,0,0.01]} fontSize={0.06} color="white">Generate</Text>
            </mesh>
            <UploadedImage imageUrl={imageUrl} />
            {showModel && <GeneratedModel />}
            <Suspense>
              {playground.meshes.map(m => (
                <Draggable key={m.id} position={m.position.toArray()}>
                  <XMesh mesh={m} autoRotate={false} />
                </Draggable>
              ))}
            </Suspense>
            <ContactShadows position={[0,0.01,0]} opacity={0.4} scale={10} blur={1.5} far={2}/>
            <ControllerDistanceScaler />
          </XROrigin>
        </XR>
        <OrbitControls />
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
