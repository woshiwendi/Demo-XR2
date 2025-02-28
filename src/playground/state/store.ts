// custom imports
import { closestK, meshParamsToTransform } from "../utils"
import { meshType } from "../types"
import { PlaygroundState } from "."
import { MeshNotFound } from "../errors"
import { equals, filter, find, update } from "../../utils"

// third party
import { create } from "zustand"
import { Euler, Quaternion, Vector3 } from "three"
import { baseState } from "../../state/store"
import { editMesh } from "../api"

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
    ...baseState<PlaygroundState>(set, get),

    id: "",
    title: "",
    meshes: [],
    mode: "mesh",
    tool: "translate",

    init: (playground) => {
        set({...playground})
    },

    getMesh(id) {
        const state = get()
        let mesh = find<meshType>(state.meshes, {id}, ['id'])

        if (mesh) {
            return mesh
        } else {
            for (const parent of state.meshes) {
                mesh = state.getSegment(id, parent)
                if (mesh) return mesh
            }
        }
        throw new MeshNotFound(id)
    },

    getSegment(id, parent) {
        const state = get()
        return state.onSegment(id, parent, (parent, mesh) => {
            if (!mesh) {
                return find<meshType>(parent.segments, {id}, ['id'])
            } else {
                return mesh
            }
        })
    },

    addMesh: async (mesh) => {
        const state = get()
        try {
            state.getMesh(mesh.id)
            console.debug(`[addMesh] >> mesh ${mesh.id} already exists...`)
            return
        } catch (error) {
            if (error instanceof MeshNotFound) {
                console.debug(`[addMesh] >> mesh ${mesh.id} not found...`)
            } else {
                throw error
            }
        }

        state.setLoading({on: true, progressText: "adding mesh..."})
        
        set({
            meshes: [
                ...state.meshes, 
                {
                    ...mesh,
                    ...meshParamsToTransform(mesh.params, {
                        position: new Vector3(state.meshes.length*1.5, 0, 0)
                    })
                } as meshType
            ]
        })
        state.setLoading({on: false, progressText: undefined})
    },

    deleteMesh: (id) => {
        const state = get()

        if (id) {
            let mesh = find<meshType>(state.meshes, {id}, ['id'])
            
            if (mesh) {
                state.setLoading({on: true, progressText: "deleting mesh..."})
                set({
                    meshes: filter(state.meshes, {id}, ['id'])
                })
            } else {
                for (const parent of state.meshes) {
                    mesh = state.deleteSegment(id, parent)
                    if (mesh?.segments.length === 0) {
                        state.setLoading({on: true, progressText: "deleting mesh..."})
                        set({
                            meshes: filter(state.meshes, mesh, ['id'])
                        })
                    }

                    if (mesh) {
                        break
                    }
                }
            }
        }
        state.setLoading({on: false, progressText: undefined})
    },

    deleteSegment: (id, parent) => {
        const state = get()
        return state.onSegment(id, parent, (parent, mesh) => {
            if (!mesh) {
                parent.segments = filter<meshType>(parent.segments, {id}, ['id'])
            }
            return parent
        })
    },

    updateMesh: async (id, data, save = true) => {
        const state = get()
        let mesh = find<meshType>(state.meshes, {id}, ['id'])
        
        if (mesh) {
            if (equals(mesh, data, ['params.scale', 'params.position', 'params.rotation'])) {
                console.debug(`[updateMesh] >> mesh is already updated...`)
                return
            }
            
            state.setLoading({on: true, progressText: "updating mesh..."})
            console.debug(`[updateMesh] >> updating ${id}...`)

            set({
                meshes: update(state.meshes, {id}, ['id'], data)
            })

            state.setLoading({on: false, progressText: undefined})

        } else {
            const segment = state.getMesh(id)
            if (equals(segment, data, ['params.scale', 'params.position', 'params.rotation'])) {
                console.debug(`[updateMesh] >> mesh is already updated...`)
                return
            }

            for (const parent of state.meshes) {
                mesh = state.updateSegment(id, parent, data)
                if (mesh) {
                    console.debug(`[updateMesh] >> updating ${id}...`)
                    set({
                        meshes: update(state.meshes, {id}, ['id'], mesh)
                    })
                    break
                }
            }
        }

        if (mesh && save) {
            state.setLoading({on: true, progressText: "saving mesh..."})
            await editMesh(id, data)
            state.setLoading({on: false, progressText: undefined})
        }
    },

    updateSegment: (id, parent, data) => {
        const state = get()
        return state.onSegment(id, parent, (parent, mesh) => {
            if (!mesh) {
                parent.segments = update<meshType>(parent.segments, {id}, ['id'], data)
            } 
            return parent 
        })
    },

    onSegment: (id, parent, callback) => {
        const state = get()

        let mesh = find<meshType>(parent.segments, {id}, ['id']) 
        if (!mesh) {
            for (const segment of parent.segments) {
               mesh = state.onSegment(id, segment, callback)
               if (mesh) {
                   return callback(parent, mesh)
               }
            }
        } else {
            return callback(parent)
        }
    },

    computeSelected(id, objects, point) {
        const state = get()
        const mesh = state.getMesh(id)
        
        const fioi = [objects[0]].reduce((prev: number[], {faceIndex: i}) => i? [...prev, i] : prev, []) // face indicies of interest
                
        const n = mesh.selected.vertices?.length || 0
        const foi = fioi.map(i => mesh.unselected.faces[i]) // faces of interest
        const rFoi = foi.map((_, i) => [n + 3*i, n + 3*i + 1, n + 3*i + 2]) // remapped faces of interest 
        
        const vioi = foi.flat()
        const kVioi = closestK(vioi.map(i => [i, mesh.unselected.vertices[i]]), point, 1).map(a => a[0])
        const voi = foi.map(face => face.map(i => mesh.unselected.vertices[i])).flat() // verticies of interest
        
        const coi = vioi.map(i => [1, 0, 0]) // colors of interest
        
        return {
            uvs: [],
            id: mesh.selected.id,
            faces: [...(mesh.selected.faces || []), ...rFoi],
            colors: [...(mesh.selected.colors || []), ...coi],
            vertices: [...(mesh.selected.vertices || []), ...voi],
        }
    },

    computeUnselected(id, objects) {
        const state = get()
        const mesh = state.getMesh(id)

        const fioi = [objects[0]].reduce((prev: number[], {faceIndex: i}) => i? [...prev, i] : prev, []) // face indicies of interest

        const m = 0
        const nfoi = mesh.unselected.faces.filter((_, i) => !fioi.includes(i)) // not faces of interest
        const rNfoi = nfoi.map((_, i) => [m + 3*i, m + 3*i + 1, m + 3*i + 2]) // remapped not faces of interest 

        const nvioi = nfoi.flat()
        const nvoi = nvioi.map(i => mesh.unselected.vertices[i]) // not verticies of interest

        const ncoi = nfoi.map(face => face.map(i => mesh.unselected.colors[i])).flat() // not colors of interest
        
        return {
            id: id,
            faces: [...rNfoi],
            colors: [...ncoi],
            vertices: [...nvoi],
            uvs: [],
        }
    },

    setMode: (mode) => {
        set({mode})
    },

    setTool: (tool) => {
        set({tool})
    },
}))