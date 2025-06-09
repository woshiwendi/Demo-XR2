// custom imports
import { PlaygroundState } from "."
import { updateMesh } from "../api"
import { MeshNotFound } from "../errors"
import { baseState } from "../../state/store"
import { closestK, meshParamsToTransform } from "../utils"
import { equals, filter, find, insert, update } from "../../utils"
import { chatType, meshType, playgroundToolType } from "../types"

// third party
import { create } from "zustand"
import { Euler, Quaternion, Vector3 } from "three"

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
    ...baseState<PlaygroundState>(set, get),

    id: "",
    title: "",
    meshes: [],
    mode: "mesh",
    chats: new Map<string, chatType>(),
    tool: {type: "translate"} as playgroundToolType,

    init: (playground) => {
        set({...playground})
    },

    getMesh(id) {
        const state = get()
        let mesh = find<meshType>(state.meshes, {id}, ['id'])
        try {
            if (mesh) {
                return mesh
            } else {
                for (const parent of state.meshes) {
                    mesh = state.getSegment(id, parent)
                    if (mesh) return mesh
                }
            }
        } catch (error) {
            console.error(`[getMesh] >>`, error)
        }
        throw new MeshNotFound(id)
    },

    getChat(meshId) {
        const state = get()
        
        if (state.chats.has(meshId)) {
            return state.chats.get(meshId)!
        }

        const chat: chatType = []
        let mesh: meshType

        try {
            mesh = state.getMesh(meshId)
        } catch (error) {
            if (error instanceof MeshNotFound) {
                return []
            } else {
                throw error
            }
        }

        // Legacy meshes do not have geo
        if (mesh.geo) {
            if (mesh.geo.systemResponse) {
                chat.unshift({meshId, message: mesh.geo!.systemResponse!, sender: "system"})
            }
            chat.unshift({meshId, message: mesh.geo!.prompt, sender: "user"})
        }

        if (mesh.prev) {
            return [...state.getChat(mesh.prev.id), ...chat]
        } return chat
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
        console.debug(`[addMesh] (mesh) >>`, mesh)  

        set({
            meshes: [
                ...state.meshes, 
                {
                    ...mesh,
                    ...meshParamsToTransform(mesh.params, {
                        position: new Vector3(state.meshes.length*1.5, 0, 0)
                    }),
                    selected: {
                        id: `${mesh.id}-selected`
                    },
                    unselected: {
                        uvs: mesh.uvs,
                        faces: mesh.faces,
                        colors: mesh.colors,
                        vertices: mesh.vertices,
                    }
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

    updateMeshParams: (id, params, save = true) => {
        return get().updateMesh(
            id, 
            {params}, 
            save, 
            (mesh, params) => equals(mesh, params, ['params.scale', 'params.position', 'params.rotation'])
        )
    },

    updateMesh: async (id, data, save = true, isUpdated = undefined) => {
        const state = get()
        let mesh = find<meshType>(state.meshes, {id}, ['id'])
        
        if (mesh) {
            if (isUpdated && isUpdated(mesh, data)) return 
            state.setLoading({on: true, progressText: "updating mesh..."})
            // console.debug(`[updateMesh] >> updating ${id}...`)

            set({
                meshes: update(state.meshes, {id}, ['id'], data)
            })

            state.setLoading({on: false, progressText: undefined})

        } else {
            const segment = state.getMesh(id)
            if (equals(segment, data, ['params.scale', 'params.position', 'params.rotation'])) {
                // console.debug(`[updateMesh] >> mesh is already updated...`)
                return
            }

            for (const parent of state.meshes) {
                mesh = state.updateSegment(id, parent, data)
                if (mesh) {
                    // console.debug(`[updateMesh] >> updating ${id}...`)
                    set({
                        meshes: update(state.meshes, {id}, ['id'], mesh)
                    })
                    break
                }
            }
        }

        if (mesh && save) {
            state.setLoading({on: true, progressText: "saving mesh..."})
            await updateMesh(id, data)
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

    computeSelected(id, objects) {
        const state = get()
        const mesh = state.getMesh(id)
        
        const fioi = [objects[0]].reduce((prev: number[], {faceIndex: i}) => i? [...prev, i] : prev, []) // face indicies of interest
        
        // TODO: setup adjaceny graph and use to find k nearest
        // TODO: use face indicies 
        // const kFioi = closestK(mesh.unselected.faces.map((face, i) => [i, face.map(i => mesh.unselected.vertices[i]).reduce((prev, curr) => prev.add(new Vector3(...curr)), new Vector3(0, 0, 0)).divideScalar(3).toArray()]), point, 2).map(a => a[0])
        
        // console.log(`[computeSelected] >> kFioi`, kFioi)
        // console.log(`[computeSelected] >> fioi`, fioi)

        const n = mesh.selected.vertices?.length || 0
        const foi = fioi.map(i => mesh.unselected.faces[i]) // faces of interest
        const rFoi = foi.map((_, i) => [n + 3*i, n + 3*i + 1, n + 3*i + 2]) // remapped faces of interest 
        
        const vioi = foi.flat()
        // const kVioi = closestK(vioi.map(i => [i, mesh.unselected.vertices[i]]), point, 1).map(a => a[0])
        const voi = foi.map(face => face.map(i => mesh.unselected.vertices[i])).flat() // verticies of interest

        const uvoi = vioi.map(i => mesh.unselected.uvs[i]) // uvs of interest
        const coi = vioi.map(i => [1, 0, 0, 1]) // colors of interest
        
        return {
            id: `${id}-selected`,
            uvs: [...(mesh.selected.uvs || []), ...uvoi],
            faces: [...(mesh.selected.faces || []), ...rFoi],
            colors: [...(mesh.selected.colors || []), ...coi],
            vertices: [...(mesh.selected.vertices || []), ...voi],
        }
    },

    computeUnselected(id, objects) {
        const state = get()
        const mesh = state.getMesh(id)

        const fioi = objects.reduce((prev: number[], {faceIndex: i}) => i? [...prev, i] : prev, []) // face indicies of interest
        
        const m = 0
        const nfoi = mesh.unselected.faces.filter((_, i) => !fioi.includes(i)) // not faces of interest
        const rNfoi = nfoi.map((_, i) => [m + 3*i, m + 3*i + 1, m + 3*i + 2]) // remapped not faces of interest 

        const nvioi = nfoi.flat()
        const nvoi = nvioi.map(i => mesh.unselected.vertices[i]) // not verticies of interest

        const nuvoi = nvioi.map(i => mesh.unselected.uvs[i]) // not uvs of interest
        const ncoi = nfoi.map(face => face.map(i => mesh.unselected.colors[i])).flat() // not colors of interest
        
        return {
            id,
            uvs: [...nuvoi],
            faces: [...rNfoi],
            colors: [...ncoi],
            vertices: [...nvoi],
        }
    },

    setMode: (mode) => {
        set({mode})
    },

    setTool: (tool) => {
        set({tool})
    },
}))