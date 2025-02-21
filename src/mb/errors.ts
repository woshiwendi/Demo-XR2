import { Edge } from "@xyflow/react";

export class CycleDetected extends Error {
    edge: Edge
    
    constructor(edge: Edge) {
        super(`cycle detected at ${edge.source} -> ${edge.target}!`)
        this.edge = edge
    }
}

export class NodeInputMissing extends Error {
    id: string
    constructor(id: string, input: string) {
        super(`input ${id} is missing ${input}!`)
        this.id = id
    }
}