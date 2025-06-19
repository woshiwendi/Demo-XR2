import { Euler, Material, Mesh, Quaternion, Vector3 } from "three";

// XR 模式下仍然需要完整 mesh 数据结构
export type meshStatusType = "segmenting" | "regenerating" | "ready" | "error" | "generating";

export type meshJsonType = {
  id: string;
  uvs: number[][];
  faces: number[][];
  colors: number[][];
  vertices: number[][];
};

export type meshParamsType = {
  mtlUrl?: string;
  textures?: string[];
  scale?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
};

export type meshGeoType = {
  prompt: string;
  img: string;
  systemResponse?: string;
};

export type meshType = Mesh &
  meshJsonType & {
    title: string;
    material: Material;

    gif: string;
    url: string;
    normals: number[][];

    status: meshStatusType;
    segments: meshType[];

    selected: meshJsonType;
    unselected: meshJsonType;

    params?: meshParamsType;

    prev?: meshType;
    isCurrent?: boolean;

    numUVs: number;
    numFaces: number;
    numColors: number;
    numNormals: number;
    numVertices: number;

    geo?: meshGeoType;
  };

export type playgroundModeType = "mesh" | "wireframe";

export type meshTransformType = {
  scale: Vector3;
  position: Vector3;
  quaternion: Quaternion;
};
