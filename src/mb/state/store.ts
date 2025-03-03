// custom imports
import flow from "./flow"
import save from "./save"
import path from "./path"
import { MoodBoardState } from "."
import { userType } from "../../user/types"
import { getMbPerms } from "../../user/api"
import { baseState } from "../../state/store"
import { deleteImg, uploadImg } from "../api"
import { arrEquals, find, update } from "../../utils"
import { edgeType, nodeStatusType, nodeType } from "../types"
import { getStateObjUpdated, getUpdated, onStatusUpdate } from "../utils"

// third party
import { temporal } from "zundo"
import { create } from "zustand"
import isDeepEqual from 'fast-deep-equal';
import { Node, useReactFlow } from "@xyflow/react"

export const useMoodboardStore = create<MoodBoardState>()(
    temporal((set, get) => {
            const base = baseState<MoodBoardState>(set, get)

            return {
                ...base, 

                // override
                select(id) {
                    base.select(id)

                    const state = get()
                    // set({
                    //     nodes: update<nodeType>(state.nodes, {id}, ['id'], {selected: true}),
                    // })
                },

                unselect(id) {
                    base.unselect(id)

                    const state = get()
                    
                    const keys = id ? ['id'] : []
                    const edges = id ? state.edges : update<edgeType>(state.edges, {}, [], {style: {opacity: 0.4}})
                    
                    set({
                        // nodes: update<nodeType>(state.nodes, {id}, keys, {selected: false}),

                        edges: edges,
                    })
                },

                ...flow(set, get),
                ...save(set, get),
                ...path(set, get),

                id: "",
                title: "",
                owner: {} as userType,

                addedNodes: [],
                deletedNodes: [],

                addedEdges: [],
                deletedEdges: [],

                perms: undefined,

                init: async (mb) => {
                    const state = get()
                    const nodeStatus = new Map<string, nodeStatusType>()
                    
                    for (let i = 0; i < mb.nodes.length; i++) {
                        const node = mb.nodes[i]
                        switch (node.type) {
                            default:
                                nodeStatus.set(node.id, node.status)
                                break
                        }   
                    }

                    set({ id: mb.id, owner: mb.owner })
                    
                    state.initNodes(mb)
                },

                initPerms: async () => {
                    set({ perms: await getMbPerms(get().id) })
                },

                initEdges: async (mb) => {
                    const state = get()
                    
                    let { edges } = getUpdated(state.id, mb.nodes, mb.edges)
                    edges = getStateObjUpdated<edgeType>(state.edges, mb.edges, edges, ['source', 'target', 'sourceHandle', 'targeHandle']) || state.edges
                    
                    for (let i = 0; i < state.nodes.length; i++) {
                        const node = state.nodes[i]
                        
                        const isPending = (node as nodeType).status === "pending"

                        let targetEdge: Partial<edgeType> = {animated: isPending}
                        let sourceEdge: Partial<edgeType> = {style: {stroke: `var(--node-title-color-${node.type})`, opacity: 0.4}} 

                        edges = update<edgeType>(edges, {target: node.id}, ['target'], targetEdge)
                        edges = update<edgeType>(edges, {source: node.id}, ['source'], sourceEdge)

                    }
                    set({ edges })
                },

                initNodes: async (mb) => {
                    const state = get()
                    
                    let { nodes } = getUpdated(state.id, mb.nodes, mb.edges) 
                    nodes = getStateObjUpdated<nodeType>(state.nodes as nodeType[], mb.nodes, nodes, ['id']) || state.nodes as nodeType[]
                    
                    for (let i = 0; i < nodes.length; i++) {
                        const node = nodes[i]
                        nodes = update<nodeType>(nodes, {id: node.id, type: 'txt'}, ['id', 'type'], {dragHandle: '.drag-handle__custom'})
                    }

                    set({ nodes })
                    state.initEdges(mb)
                },
                
                addNode: (node, status, owner, save = true) => {
                    const state = get()
                
                    set({
                        nodes: [...state.nodes, {...node, status, owner, update: save ? "add" : undefined} as Node]
                    })
                    
                    if (save) {
                        state.save()
                    }

                },
                
                updateNodeData: async (id, data, save = true) => {
                    const state = get()
                    console.log(`[updateNodeData] >> updating node data for ${id}...`)
                    // console.log(`[updateNodeData] (data) >>`, data)

                    const node: nodeType | undefined = find<nodeType>(state.nodes, {id}, ['id'])
                    if (!node) return

                    switch (node.type) {
                        case "img":
                        case "sketch":
                            if (state.perms?.isOwner || state.perms?.isEditor) {
                                let url = ""
                                if (data.img instanceof File) {
                                    state.setLoading({on: true, progressText: "uploading image..."})
                                    url = await uploadImg(state.id, node.id, data.img) || ""
                                    state.setLoading({on: false, progressText: ""})
                                    
                                } else if (!data.img && node.data?.img) {
                                    state.setLoading({on: true, progressText: "deleting image..."})
                                    await deleteImg(state.id, node.id)
                                    state.setLoading({on: false, progressText: ""})
                                } 
                                data.img = url || data.img
                            }
                            break
                        case "mesh":
                        case "comment":
                        case "generatedImg":
                        case "txt":
                            break
                        default: break
                    }

                    set({
                        nodes: update<nodeType>(state.nodes, {id}, ['id'], {data, update: save ? "update" : undefined})
                    })

                    if (save) {
                        state.save()
                    }
                },

                updateNode: (id, node, save = false) => {
                    const state = get()

                    set({ 
                        nodes: update<nodeType>(state.nodes, {id}, ['id'], {...node, update: save ? "update" : undefined}), 
                        edges: update<edgeType>(state.edges, {target: id}, ['target'], {animated: node.status === "pending"}),
                    })

                    if (save) {
                        state.save()
                    }
                }
            }
        }, {
            partialize: (state) => {
                const { nodes, edges, ...rest } = state;
                return { nodes, edges };
            },
            limit: 100,
            equality: (pastState, currentState) => {
                if (pastState.nodes.length === 0) return true 
                if (!isDeepEqual(pastState, currentState)) {
                    const nodeKeys = ['id', 'data.src', 'data.img', 'data.title', 'type', 'owner.id', 'data.playground.id', 'mode']
                    const edgeKeys = ['id', 'source', 'target', 'sourceHandle', 'targeHandle']
                    
                    if (
                        !arrEquals(pastState.nodes, currentState.nodes, nodeKeys) || 
                        !arrEquals(pastState.edges, currentState.edges, edgeKeys) 
                    ) {
                        // console.log(`[equality] >>`, pastState, currentState)
                        return false
                    } return true 
                } return true 
            },
        }
    )
)