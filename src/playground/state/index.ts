// custom imports
import { BaseState } from "../../state"
import { loadingType } from "../../types"
import { meshType, playgroundType, playgroundModeType, playgroundToolType, meshJsonType } from "../types"

// third party 
import { Intersection, Object3D, Object3DEventMap } from "three"

export interface SaveState {
    // save: () => void
}

export interface PlaygroundState extends BaseState, SaveState {
    id: string
    title: string
    meshes: meshType[]
    mode: playgroundModeType
    tool: playgroundToolType 

    init: (playground: playgroundType) => void

    getMesh: (id: string) => meshType
    deleteMesh: (id: string) => void
    addMesh: (mesh: meshType) => void
    updateMesh: (id: string, data: Partial<meshType>, save?: boolean) => void

    getSegment: (id: string, parent: meshType) => meshType | undefined
    deleteSegment: (id: string, parent: meshType) => meshType | undefined
    updateSegment: (id: string, parent: meshType, data: Partial<meshType>) => meshType | undefined
    onSegment: (id: string, parent: meshType, callback: (parent: meshType, mesh?: meshType) => meshType | undefined) => meshType | undefined

    computeSelected: (id: string, objects: Intersection<Object3D<Object3DEventMap>>[], point: number[]) => meshJsonType
    computeUnselected: (id: string, objects: Intersection<Object3D<Object3DEventMap>>[]) => meshJsonType
    
    setMode: (mode: playgroundModeType) => void
    setTool: (tool: playgroundToolType) => void
}

export const selector = (state: PlaygroundState) => ({
    id: state.id,
    mode: state.mode,
    tool: state.tool,
    title: state.title,
    meshes: state.meshes,
    loading: state.loading,
    selected: state.selected,

    init: state.init,
    getMesh: state.getMesh,

    addMesh: state.addMesh,
    deleteMesh: state.deleteMesh,
    updateMesh: state.updateMesh,

    select: state.select,
    unselect: state.unselect,

    setMode: state.setMode,
    setTool: state.setTool,
    setLoading: state.setLoading,

    computeSelected: state.computeSelected,
    computeUnselected: state.computeUnselected
})