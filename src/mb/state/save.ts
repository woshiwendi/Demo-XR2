// custom imports 
import { getUpdated } from "../utils";
import { setStateType } from "../../types";
import { edgeType, nodeType } from "../types";
import { MoodBoardState, SaveState } from ".";
import { addToLocalStorage, filter } from "../../utils";
import { editMoodboard, editMoodboardUnsecure } from "../api";

export default function save(set: setStateType<MoodBoardState>, get: () => MoodBoardState): SaveState  {
    return {
        save: async () => {
            const state = get()
            
            const { nodes: updatedNodes, edges: updatedEdges } = getUpdated(state.id, state.nodes as nodeType[], state.edges)

            if (!updatedNodes.length && !updatedEdges.length) return 
            
            
            const aComments = _anonFilter(_commentsFilter(updatedNodes as nodeType[]))
            // handle unsecure changes
            if (aComments.length) {
                state.setLoading({on: true, progressText: "commenting..."})
                await editMoodboardUnsecure(state.id, aComments)
            } 
            
            let mb;
            const naNodes = _anonFilter(updatedNodes as nodeType[], eq => !eq)
            // handle secure changes
            if ((naNodes.length || updatedEdges.length) && (state.perms?.isOwner || state.perms?.isEditor)) {
                state.setLoading({on: true, progressText: "saving..."})
                mb = await editMoodboard(state.id, state.title, naNodes, updatedEdges)
            }
            
            const naComments = _anonFilter(_commentsFilter(updatedNodes as nodeType[]), eq => !eq)
            if (naComments.length && (state.perms && !state.perms.isOwner && !state.perms.isEditor)) {
                state.setLoading({on: true, progressText: "commenting..."})
                mb = await editMoodboard(state.id, state.title, naComments)
            }
            
            const edges: edgeType[] = []
            for (const edge of state.edges) {
                if ((edge as edgeType).update === "delete") continue
                edges.push({...edge, update: 'ignore'} as edgeType)
            }

            const nodes: nodeType[] = []
            for (const node of state.nodes) {
                if ((node as nodeType).update === "delete") continue
                nodes.push({...node, update: 'ignore'} as nodeType)
            }

            if (mb) addToLocalStorage(state.id, JSON.stringify(mb))
            
            set({
                nodes: nodes,
                edges: edges,

                loading: {on: false, progressText: undefined} 
            })
        },
    } 
}

const _anonFilter = (nodes: nodeType[], check = (eq: boolean) => eq) => nodes.filter((node) => check(!node.owner))
const _commentsFilter = (nodes: nodeType[], check = (eq: boolean) => eq) => filter<nodeType>(nodes, {type: "comment"}, ['type'], undefined, check)
