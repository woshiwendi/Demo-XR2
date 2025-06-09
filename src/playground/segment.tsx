// custom imports
import { meshType } from './types';
import { selector } from './state';
import { useCursor } from './hooks';
import { useCustomState } from '../utils';
import { usePlaygroundStore } from './state/store';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { isLocked, toFloat32Array, toUint32Array } from './utils';

// 3rd part imports
import { useShallow } from 'zustand/shallow';
import { useEffect, useMemo, useRef } from 'react';
import { generateUUID } from 'three/src/math/MathUtils';
import { ThreeEvent, useFrame, useThree, MeshProps, useLoader } from '@react-three/fiber';
import { DoubleSide, Raycaster, Vector2, Mesh, Intersection, Object3D, Object3DEventMap, Material } from 'three';

// static imports 
import { ReactComponent as CircleCursor } from '../assets/cursors/circle-outline.svg'

export type XSegmentProps = MeshProps & {
    name?: string
    segment: meshType
    disabled?: boolean
    autoRotate?: boolean
    onFacesSelect?: (objects: Intersection<Object3D<Object3DEventMap>>[], point: number[]) => void
}

export function XSegment({disabled, segment: {id, uvs = [], vertices = [], colors = [], faces = [], material, status, position, ...segment}, name, ref, autoRotate, onFacesSelect, onClick, ...props}: XSegmentProps) {
    const segmentRef = useRef<Mesh>(null!)

    const mtlLoader = new MTLLoader()

    const [mtl, setMTL] = useCustomState<{[key: string]: Material}>(undefined)

    useEffect(() => { 
        if (segment.params?.mtlUrl) {
            mtlLoader.load(segment.params.mtlUrl, (mtl) => {
                mtl.preload()
                // if (segment.params?.textures) {
                //     mtl.loadTexture(segment.params?.textures[0])
                // }
                setMTL(mtl.materials)
            })
        } 
    }, [segment.params?.mtlUrl])

    const locked = useMemo(() => isLocked(status), [status])
    const { mode, tool, selected, select, unselect } = usePlaygroundStore(useShallow(selector))

    useFrame((state, delta) => {
        const material = segmentRef.current.material
        if (locked) {
            if (material instanceof Material) {
                material.transparent = true
                material.opacity = 0.6 + Math.max(-0.5, Math.sin(new Date().getTime() * .0045))
            } else {
                if (material instanceof Material) {
                    material.transparent = false
                }
            }
        }
    })
    const { camera, scene } = useThree((state) => ({ camera: state.camera, scene: state.scene }))
    const { set: setCursor } = useCursor()

    const selectFaces = (event: ThreeEvent<PointerEvent | MouseEvent>) => {
        const mouse = new Vector2()
        const raycaster = new Raycaster()
        
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        raycaster.setFromCamera( mouse.clone(), camera );   
        
        const objects = raycaster.intersectObject(segmentRef.current, false)
        const iPoint = segmentRef.current.worldToLocal(objects[0].point) // intersection point
        // console.debug(`[XSegment][selectFaces] (iPoint) >>`, iPoint)

        if (!iPoint) return
        
        onFacesSelect?.(objects, [iPoint.x, iPoint.y, iPoint.z])
    }

    return (
        <mesh 
            {...props}
            {...segment}

            name={name}
            ref={segmentRef}
            key={generateUUID()}
            onPointerMissed={(event: any) => {
                if (event.type === "click") {
                    if (!event.shiftKey) {
                        unselect(id)
                    }
                    props.onPointerMissed?.(event)
                }
            }}
            
            onPointerOver={(event: any) => {
                if (locked) return
                event.stopPropagation()
                switch (tool.type) {
                    case "faceSelector":
                        setCursor(
                            <svg xmlns="http://www.w3.org/2000/svg" width={tool.settings.size} height={tool.settings.size} viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="9" fill="#fff" stroke="#000" strokeWidth="0.25"></circle>
                            </svg>
                        )
                        if (event.shiftKey) {
                            selectFaces(event)
                        }
                        break 
                    case "scale":
                    case "rotate":
                    case "translate":
                    default:
                        break 
                }
            }}

            onPointerLeave={() => setCursor("default")}

            onClick={(event: any) => {
                if (locked || disabled) return
                // event.stopPropagation()
                switch (tool.type) {
                    case "faceSelector":
                        if (event.shiftKey) {
                            selectFaces(event)
                        }
                        break
                    case "scale":
                    case "rotate":
                    case "translate":
                    default:
                        if (event.shiftKey) {
                            if (selected.includes(id)) {
                                unselect(id)
                            } else {
                                select(id)
                            }
                        } else {
                            unselect()
                            select(id)
                        }
                        break 
                }
                onClick && onClick(event)
            }}
        >
            <bufferGeometry attach="geometry">
                <bufferAttribute 
                    itemSize={1} 
                    attach="index" 
                    count={3*faces.length} 
                    array={toUint32Array(faces)}
                />
                <bufferAttribute 
                    itemSize={3} 
                    attach="attributes-position" 
                    count={vertices.length / 3} 
                    array={toFloat32Array(vertices)}
                />
                <bufferAttribute 
                    itemSize={2} 
                    attach="attributes-uv" 
                    count={uvs.length / 2} 
                    array={toFloat32Array(uvs)}
                />
                <bufferAttribute 
                    itemSize={4} 
                    attach="attributes-color" 
                    count={colors.length / 4} 
                    array={selected.includes(id)? 
                        toFloat32Array(new Array(colors.length).fill([1, 1, 0, 1])) : toFloat32Array(colors)
                    }
                />
            </bufferGeometry>

            <meshPhysicalMaterial
                {...(mtl? Object.values(mtl)[0] : {})}
                
                needsUpdate 
                vertexColors
                side={DoubleSide} 
                attach={"material"}  
                wireframe={mode === "wireframe"}
                color={selected.includes(id) && tool.type !== "faceSelector" ? "yellow" : undefined} 
            />
        </mesh>
    )
}
