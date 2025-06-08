// custom imports
import { selector } from './state';
import { XSegment } from './segment';
import { useCustomState } from '../utils';
import { usePlaygroundStore } from './state/store';
import { extractMeshTransform, getMeshTransform } from './utils';
import { meshJsonType, meshTransformType, meshType } from './types';

// 3rd part imports
import { useRef } from 'react';
import { Euler, Group, Mesh } from 'three';
import { useShallow } from 'zustand/shallow';
import { GroupProps } from '@react-three/fiber';


export type XMeshProps = GroupProps & {
    mesh: meshType
    highlight?: boolean
    autoRotate?: boolean
}

export function SMesh({mesh: {id, segments, ...mesh}, autoRotate, ...props}: XMeshProps) {
    const groupRef = useRef<Group>(null!)
    const meshRefs = useRef<(Mesh | null)[]>([])
    
    const { selected } = usePlaygroundStore(useShallow(selector))

    return (
        <group 
            name={id} 
            {...props}
            ref={groupRef} 
        >
            {segments?.map((segment, i) => {
                const MeshComp = segment.segments.length > 0 ? SMesh : XMesh
                return (
                    <MeshComp 
                        mesh={segment} 
                        key={segment.id}
                        highlight={selected === id}
                    />
                )
            })}
        </group>
    )
}

export function XMesh({mesh: {id, segments, status, ...mesh}, autoRotate, ...props}: XMeshProps) {
    const [unselectedMesh, setUnselectedMesh] = useCustomState<meshType>({...mesh, id})
    const [selectedMesh, setSelectedMesh] = useCustomState<meshType>({...mesh.selected, ...extractMeshTransform(mesh)})

    const nTransform = useRef<meshTransformType>(extractMeshTransform(mesh))
    const sTransform = useRef<meshTransformType>(extractMeshTransform(mesh))
    
    const { computeSelected, computeUnselected, updateMeshParams, updateMesh } = usePlaygroundStore(useShallow(selector))
    // console.debug(`[XMesh] >> rendering ${selectedMesh.id}...`)

    return (
        <group {...props}>
            <group 
                name={id} 
                position={mesh.position} 
            >
                <XSegment 
                    segment={{...unselectedMesh, status} as meshType}
                    onFacesSelect={(objects) => {
                        const selected = computeSelected(id, objects)
                        const unselected = computeUnselected(id, objects)

                        // updateMesh(id, {selected})

                        setSelectedMesh(selected)
                        // setUnselectedMesh(unselected)
                    }}
                    
                    onUpdate={event => {
                        nTransform.current = getMeshTransform(event) 

                        const position = nTransform.current.position.toArray()
                        const scale = nTransform.current.scale.toArray()
                        const rotation = new Euler().setFromQuaternion(nTransform.current.quaternion).toArray().slice(0, 3) as [number, number, number]

                        updateMeshParams(id, { scale, position, rotation })
                    }}
                />
            </group>
            <group 
                name={selectedMesh.id}
                position={selectedMesh.position}
            >
                <XSegment 
                    disabled
                    segment={{...selectedMesh, status} as meshType}
                    onUpdate={event => {
                        sTransform.current = getMeshTransform(event)
                    }}

                    onPointerMissed={event => {}}
                />
            </group>
        </group>
    )
}

