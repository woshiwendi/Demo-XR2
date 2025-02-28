// custom imports 
import { find } from "../../utils";
import { nodeType } from "../types";
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
                    case "mesh":
                        const data = node.type === "generatedImg"? node.data.img : node.data.playground
                        const geo_edge = find<Edge>(edges, {targetHandle: "geometry"}, ['targetHandle'])

                        // checks if there is a geometry
                        if ((data && !(node as nodeType).reRun) || geo_edge) {
                            const geo_source = find<Node>(state.nodes, {id: geo_edge?.source}, ['id'])
    
                            isValidNode(geo_source)   
                        } else {
                            state.updateNode(node.id, {reRun: false})
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