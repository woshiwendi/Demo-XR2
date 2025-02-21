// custom imports
import { setStateType } from "../../types";
import { edgeType, nodeType } from "../types";
import { FlowState, MoodBoardState } from ".";
import { find, filter, update, findAll } from "../../utils";

// third party 
import { generateUUID } from "three/src/math/MathUtils";
import { addEdge, applyEdgeChanges, applyNodeChanges,Node, Edge, NodeChange, EdgeChange } from "@xyflow/react";

export default function flow(set: setStateType<MoodBoardState>, get: () => MoodBoardState): FlowState {
    return {
        nodes: [],
        edges: [],
        
        // onNodesDelete: (nodes) => { },
        onNodesChange: (changes) => {
            const state = get()
            
            const remove = findAll<nodeType>(changes, {type: 'remove'}, ['type'])
            let other = findAll<NodeChange>(changes, {type: 'remove'}, ['type'], undefined, eq => !eq)
            
            const nodes = update<nodeType>(state.nodes, (a: nodeType) => find(other, a, ['id']) && a.update !== 'add', ['id'], {update: 'ignore'})
        
            set({ nodes: update<nodeType>(applyNodeChanges(other, nodes), remove, ['id'], {update: 'delete'}) });

            if (remove.length > 0) {
                state.save()
            }
        },

        onNodeDragStop: (event, node) => { 
            const state = get()
            
            set({ nodes: update<nodeType>(state.nodes, node, ['id'], {update: 'update'}) });

            state.save() 
        },

        onConnect: (conn) => {
            const state = get()
    
            const node: nodeType | undefined = find<nodeType>(state.nodes, {id: conn.source}, ['id'])
            const edge = {...conn, style: {stroke: `var(--node-title-color-${node?.type})`}} as edgeType
            set({
                edges: addEdge<edgeType>({...edge, id: generateUUID(), update: 'add'}, state.edges),
            })
            state.save()
        },
        // onEdgesDelete: (edges) => { },
        onEdgesChange: (changes) => {
            const state = get()
            
            const remove = findAll<edgeType>(changes, {type: 'remove'}, ['type'])
            let other = findAll<EdgeChange>(changes, {type: 'remove'}, ['type'], undefined, eq => !eq)
            const keys = ['id']

            const edges = update<edgeType>(state.edges, (a: edgeType) => find(other, a, keys) && a.update !== 'add', keys, {update: 'update'})
            set({ edges: update<edgeType>(applyEdgeChanges(other, edges), remove, keys, {update: 'delete'}) });

            if (remove.length > 0) {
                state.save()
            }
        },
        onEdgeMouseEnter: (event, edge) => {
            const state = get()
            set({
                edges: update<edgeType>(state.edges, edge, ['source', 'target', 'sourceHandle', 'targeHandle'], {style: {...edge.style, opacity: 1}}),
            })
        },

        onEdgeMouseLeave: (event, edge) => {
            const state = get()

            if (edge.selected) return

            set({
                edges: update<edgeType>(state.edges, edge, ['source', 'target', 'sourceHandle', 'targeHandle'], {style: {...edge.style, opacity: 0.4}}),
            })
        },

        onEdgeClick: (event, edge) => {
            const state = get()

            const edges = update<edgeType>(state.edges, {}, [], {style: {opacity: 0.4}})

            set({
                edges: update<edgeType>(edges, edge, ['source', 'target', 'sourceHandle', 'targeHandle'], {style: {opacity: edge.selected ? 0.4 : 1}}),
            })
        },
        
        isValidConnection: (edge) => {
            if (!edge.sourceHandle) return false
            const state = get()

            if (find<edgeType>(state.edges, edge, ['source', 'target', 'sourceHandle', 'targetHandle'])) return false
            
            switch (edge.targetHandle) {
                case "prompt":
                    if (edge.sourceHandle !== "txt") return false
                    break
                case "style":
                    // return false
                    if (["mesh", "sketch"].includes(edge.sourceHandle)) return false 
                    break 
                case "mesh":
                    break 
                case "geometry":
                    if (edge.sourceHandle === "mesh") return false
                    const target: Node | undefined = find<Node>(state.nodes, edge, ['id'], ['target'])
                    if (!target) return false 
    
                    const geoConns: Edge[] = filter(
                        state.edges, 
                        {
                            target: target?.id, 
                            targetHandle: "geometry", 
                        }, 
                        ['target', 'targetHandle'],
                        undefined, 
                        (eq) => eq
                    )
                    if (geoConns.length == 1 && geoConns[0].source !== edge.source) return false 
                    break 
                default: break
            }
            return true 
        },
    } 
}