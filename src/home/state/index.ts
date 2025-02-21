import { BaseState } from "../../state"
import { loadingType } from "../../types"

export interface HomeState extends BaseState{
}

export const selector = (state: HomeState) => ({
    loading: state.loading,
    setLoading: state.setLoading
})