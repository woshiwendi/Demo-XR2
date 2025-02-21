// custom imports
import { CycleDetected, NodeInputMissing } from "./errors"
import { filter, filterObj, find, findAll } from "../utils"
import { edgeType, mbType, nodeStatusType, nodeType } from "./types"

// third party
import { Node, Edge } from "@xyflow/react"

// store utils
export function remove<T>(A: (Node | Edge)[], added: T[], deleted: string[], keys: string[]): {added: T[], deleted: string[]} {
    A.forEach(Ai => {
        if (find(added, Ai, keys)) {
            added = filter<T>(added, Ai, keys)
        } else deleted.push(Ai.id)
    })

    return {added, deleted}
}

export function onStatusUpdate(nodeStatus: Map<string, nodeStatusType>, id: string, status: nodeStatusType) {
    nodeStatus = new Map(nodeStatus)
    nodeStatus.set(id, status)
    return nodeStatus
}

export function getUpdated(mid: string, nodes: nodeType[], edges: edgeType[]): {nodes: nodeType[], edges: edgeType[]} {
    let cachedMb: mbType = {} as mbType
    const cached = localStorage.getItem(mid)

    if (cached) {
        cachedMb = JSON.parse(cached)
    }
    
    const removeNodes = findAll<nodeType>(nodes, {update: "delete"}, ["update"])
    const removeEdges = findAll<edgeType>(edges, {update: "delete"}, ["update"])

    const nodeKeys = ['id', 'data.title', 'data.src', 'position.x', 'position.y', 'status', 'type', 'data.img', 'data.playground.id', 'mode']
    const updatedNodes = filter<nodeType>(nodes.filter(node => !(node.update && ["ignore", "delete"].includes(node.update))), cachedMb.nodes, nodeKeys)

    const edgeKeys = ['source', 'target', 'sourceHandle', 'targetHandle']
    const updatedEdges = filter<edgeType>(edges.filter(edge => !(edge.update && ["ignore", "delete"].includes(edge.update))), cachedMb.edges, edgeKeys)

    return {
        nodes: [...updatedNodes, ...removeNodes],
        edges: [...updatedEdges, ...removeEdges]
    }
}

export function getStateObjUpdated<T>(stateObjs: T[], mbObjs: T[], objs: T[], keys: string[]): T[] | undefined {
    const added = objs.filter(obj => !find<T>(stateObjs, obj, keys))
    const changed = objs.filter(obj => find<T>(stateObjs, obj, keys))

    const deleted = stateObjs.filter(obj => !find<T>(mbObjs, obj, keys))
    const unchanged = stateObjs.filter(obj => !find<T>(objs, obj, keys) && find<T>(mbObjs, obj, keys))
    
    if (added.length || changed.length || deleted.length) {
       return [...added, ...changed, ...unchanged]
    }
}

// api utils
export function prepareNodesForSave<T>(nodes: nodeType[], removeKeys: string[] = [], setKeys: any = {}) {
    return nodes.map(node => ({...node, data: {...filterObj<T>(node.data, removeKeys, setKeys)}}))
}

// path finder utils 
export function bfs(nodes: Node[], edges: Edge[], start: Node): Map<Node, Edge[]> {
    const queue: Node[] = [start]
    const seen = new Set<string>([start.id])

    const path = new Map<Node, Edge[]>()
    path.set(start, [])

    const nodeMap = new Map<string, Node>()
    nodes.forEach(node => nodeMap.set(node.id, node))

    while (queue.length > 0) {
        let n  = queue.length
        const m = edges.length

        while (n > 0) {
            const node = queue.shift()
            
            for (let i = m - 1; i >= 0; i--) {
                const edge = edges[i]
                if (edge.target !== node?.id) continue
                
                path.get(node!)!.push(edge)
                if (seen.has(edge.source)) continue

                const source = nodeMap.get(edge.source)
                
                queue.push(source!)
                seen.add(edge.source)
                path.set(source!, [])

                edges.slice(i, 1)
            }
            n--
        }
    }

    console.log("[bfs] (path) >>", path)
    return path
}

export function dfs(nodes: Node[], edges: Edge[], start: Node): [Node, Edge[]][] {
    const path: [Node, Edge[]][] = [[start, []]]
    
    const nodeMap = new Map<string, Node>()
    nodes.forEach(node => nodeMap.set(node.id, node))
    
    const explore = (start: number, seen: Set<string>): void => {
        const m = edges.length

        for (let i = m - 1; i >= 0; i--) {
            const edge = edges[i]
            if (edge.target !== path[start][0].id) continue
            
            const source = nodeMap.get(edge.source)
            if (seen.has(edge.source)) {
                throw new CycleDetected(edge)
            }
            
            seen.add(edge.source)
            path.push([source!, []])
            path[start][1].push(edge)

            edges.slice(i, 1)
            
            const n = path.length
            explore(n - 1, seen)
            seen.delete(edge.source)
        }
    }

    explore(0, new Set<string>([start.id]))
    console.log("[dfs] (path) >>", path)
    return path
}

export function isValidNode(node?: Node) {
    if (!node) return 

    switch (node.type) {
        case "txt":
            if (!node.data?.src) {
                throw new NodeInputMissing(node!.id, "prompt (prompt can not be empty)")
            }
            break
        case "img":
            if (!node.data?.img) {
                throw new NodeInputMissing(node!.id, "img (upload an image)")
            }
            break
        case "sketch":
            if (!node.data?.img) {
                throw new NodeInputMissing(node!.id, "img (upload a sketch)")
            }
            break
        default: break
    }

    return true
}
