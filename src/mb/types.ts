import { Node, Edge } from "@xyflow/react"
import { playgroundType } from "../playground/types"
import { userType } from "../user/types"

export type updateTypes = "add" | "delete" | "updated" | "ignore"

export type edgeType = Edge & {
    id: string

    update?: updateTypes
}

export type nodeStatusType = "ready" | "done" | "error" | "running" | "pending" | "static"
export type nodeTypes = "img" | "sketch" | "txt" | "mesh" | "generatedImg" | "segment" | "playground" | "remesh" | "texture" | "comment"
export type nodeModeTypes = "generate" | "style" | "replace" | "inpaint" | "recolor" | "removeBackground" | "replaceBackground" | "structure"

export type nodeParamsType = {
    geoStrength?: number 
    styleStrength?: number
}

export type nodeType = Node & {
    data: nodeDataType
    status: nodeStatusType

    owner?: userType

    mode?: nodeModeTypes
    update?: updateTypes
    params?: nodeParamsType

    reRun?: boolean
}

export type mbMetaType = {
    id: string
    title: string
    owner: userType
    updatedAt?: string
}

export type mbType = mbMetaType & {
    nodes: nodeType[]
    edges: edgeType[]
}

export type nodeDataType = {
    id: string
    src?: string
    title: string
    img?: string | File
    playground?: playgroundType
}

export type partialNodeDataType = {
    id: string
    src?: string
}