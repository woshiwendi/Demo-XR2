// custom imports
import { BaseState } from "../../state"
import { permsType, userType } from "../../user/types"
import { nodeStatusType, nodeType, edgeType, mbType, nodeDataType, nodeModeTypes } from "../types"

// third party
import { MouseEvent } from "react"
import { Node, Edge, Connection, EdgeChange, NodeChange } from "@xyflow/react"

export interface FlowState {
    nodes: Node[]
    edges: Edge[]

    // onNodesDelete: (nodes: Node[]) => void
    onNodesChange: (changes: NodeChange[]) => void
    onNodeDragStop: (event: MouseEvent, node: Node) => void

    onConnect: (conn: Connection) => void
    // onEdgesDelete: (edges: Edge[]) => void
    onEdgesChange: (changes: EdgeChange[]) => void
    onEdgeClick: (event: MouseEvent, edge: Edge) => void
    isValidConnection: (edge: Edge | Connection) => boolean
    onEdgeMouseEnter: (event: MouseEvent, edge: Edge) => void
    onEdgeMouseLeave: (event: MouseEvent, edge: Edge) => void
}

export interface SaveState {
    save: () => Promise<void | mbType>
}

export interface PathState {
    getPath: (start: string) => [Node, Edge[]][]
    isValidPath: (path: [Node, Edge[]][]) => boolean
}

export interface MoodBoardState extends FlowState, SaveState, PathState, BaseState {
    id: string
    title: string
    owner: userType

    perms?: permsType

    initPerms: () => void
    init: (mb: mbType) => void
    initEdges: (mb: mbType) => void
    initNodes: (mb: mbType) => void
    
    updateNode: (id: string, node: Partial<nodeType>, save?: boolean) => void
    addNode: (node: Node, status: nodeStatusType, owner?: Partial<userType>, save?: boolean) => void

    updateNodeData: (id: string, data: Partial<nodeDataType>, save?: boolean) => void
}

export const selector = (state: MoodBoardState) => ({
    id: state.id,
    title: state.title,
    nodes: state.nodes,
    edges: state.edges,

    loading: state.loading,
    setLoading: state.setLoading,
    
    perms: state.perms,
    owner: state.owner,
    
    init: state.init,
    initPerms: state.initPerms,
    
    selected: state.selected, 
    select: state.select,
    unselect: state.unselect,

    addNode: state.addNode,
    
    onNodesChange: state.onNodesChange,
    onNodeDragStop: state.onNodeDragStop,

    updateNodeData: state.updateNodeData,

    updateNode: state.updateNode,

    onConnect: state.onConnect,
    onEdgeClick: state.onEdgeClick,
    onEdgesChange: state.onEdgesChange,
    onEdgeMouseEnter: state.onEdgeMouseEnter,
    onEdgeMouseLeave: state.onEdgeMouseLeave,
    isValidConnection: state.isValidConnection,

    getPath: state.getPath,
    isValidPath: state.isValidPath,

    save: state.save
})