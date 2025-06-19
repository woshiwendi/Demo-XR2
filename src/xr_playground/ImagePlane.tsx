import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';

type ImagePlaneProps = {
  url: string;
  position?: [number, number, number];
  scale?: [number, number, number];
};

export default function ImagePlane({
  url,
  position = [2, 1.5, -1],
  scale = [1, 1, 1],
}: ImagePlaneProps) {
  const texture = useLoader(THREE.TextureLoader, url);

  return (
    <mesh position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}
