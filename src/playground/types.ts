// custom imports
import { Euler, Material, Mesh, Quaternion, Vector3 } from "three"

// third party

export type meshStatusType = "segmenting" | "regenerating" | "ready" | "error" | "generating"

export type meshJsonType = {
    id: string 

    uvs: number[][]
    faces: number[][]
    colors: number[][]
    vertices: number[][]
}

export type meshType = Mesh & meshJsonType & {
    title: string
    material: Material  
    
    gif: string 
    url: string
    normals: number[][]
    
    status: meshStatusType
    segments: meshType[] 

    selected: meshJsonType
    unselected: meshJsonType

    params?: meshParamsType

    prev?: meshType
    isCurrent?: boolean

    numUVs: number
    numFaces: number
    numColors: number
    numNormals: number
    numVertices: number

    geo?: meshGeoType 
} 

export type meshParamsType = {
    mtlUrl?: string
    textures?: string[]
    
    scale?: [number, number, number]
    position?: [number, number, number]
    rotation?: [number, number, number]
}

export type meshGeoType = {
    prompt: string 
    img: string 
    systemResponse?: string
}

export type chatType = {meshId: string, message: string, sender: "user" | "system"}[]

export type playgroundType = {
    id: string,
    title: string, 
    meshes: meshType[]
}

export type playgroundModeType = "mesh" | "wireframe"

export type meshToolType = "rotate" | "translate" | "scale"

export type playgroundToolSettingsType = {
    [key: string]: any
}

export type playgroundToolType = {
    type: meshToolType | "grab" | "segment" | "stylize" | "faceSelector"
    settings: playgroundToolSettingsType
}

export type meshTransformType = {
    scale: Vector3
    position: Vector3
    quaternion: Quaternion
}