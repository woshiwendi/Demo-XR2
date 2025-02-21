// custom imports 
import { find } from "../../utils";
import { setStateType } from "../../types";
import { dfs, isValidNode } from "../utils";
import { MoodBoardState, PathState} from ".";
import { CycleDetected, NodeInputMissing } from "../errors";

// third party
import { Node, Edge } from "@xyflow/react";

export default function path(set: setStateType<MoodBoardState>, get: () => MoodBoardState): PathState  {
    return {
        getPath: (start) => {
            const state = get()
            const node = find<Node>(state.nodes, {id: start}, ['id'])
            if (!node) return []
            
            try {
    
                const path = dfs(state.nodes, state.edges, node)
                
                state.isValidPath(path)
                return path
            } catch (error) {
                if (error instanceof CycleDetected) {
                    console.error(error.message)
                    return []
                }
                throw error
            }
        },
    
        isValidPath(path) {
            const state = get()
    
            for (let i = 0; i < path.length; i++) {
                const [node, edges] = path[i]
                switch (node.type) {
                    case "generatedImg":
                        const img_geo_edge = find<Edge>(edges, {targetHandle: "geometry"}, ['targetHandle'])
                        
                        if (img_geo_edge) {
                            const img_geo_source = find<Node>(state.nodes, {id: img_geo_edge?.source}, ['id'])
    
                            isValidNode(img_geo_source)   
                        } else {
                            throw new NodeInputMissing(node.id, "geometry")
                        }
                        break 
    
                    case "mesh":
                        const mesh_geo_edge = find<Edge>(edges, {targetHandle: "geometry"}, ['targetHandle'])
                        if (mesh_geo_edge) {
                            const mesh_geo_node = find<Node>(state.nodes, {id: mesh_geo_edge?.source}, ['id'])
    
                            isValidNode(mesh_geo_node)   
                        } else{
                            throw new NodeInputMissing(node.id, "geometry")
                        }
                        break
                    default: break
                }
            }
            console.log(`[isValidPath] >> valid path detected...`)
            return true
        },
    } 
}