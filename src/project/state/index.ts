import { BaseState } from "../../state"
import { mbMetaType } from "../../mb/types"

export interface ProjectState extends BaseState {
    id: string
    title: string
    mbs: mbMetaType[]
    
    init: (pid: string) => void
}

export const selector = (state: ProjectState) => ({
    id: state.id,
    mbs: state.mbs,
    title: state.title,

    init: state.init,

    loading: state.loading,
    setLoading: state.setLoading
})