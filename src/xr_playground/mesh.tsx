// xr_playground/mesh.tsx
import { Group, Mesh } from 'three';
import { useRef } from 'react';
import { GroupProps, useFrame } from '@react-three/fiber';
import { meshType } from '../playground/types';
import { XSegment } from '../playground/segment'; // 可以共用

export type XMeshProps = GroupProps & {
  mesh: meshType;
  highlight?: boolean;
  autoRotate?: boolean;
};

export function SMesh({ mesh: { id, segments }, autoRotate, ...props }: XMeshProps) {
  const groupRef = useRef<Group>(null!);

  return (
    <group ref={groupRef} name={id} {...props}>
      {segments?.map((segment) => {
        const MeshComp = segment.segments.length > 0 ? SMesh : XMesh;
        return <MeshComp key={segment.id} mesh={segment} />;
      })}
    </group>
  );
}

export function XMesh({ mesh, autoRotate = false, ...props }: XMeshProps) {
  const groupRef = useRef<Group>(null!);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      <group name={mesh.id} position={mesh.position}>
        <XSegment segment={mesh} />
      </group>
    </group>
  );
}
