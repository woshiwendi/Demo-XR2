// custom imports
import { HomeState } from "."

// third party
import { create } from "zustand"
import { baseState } from "../../state/store"

export const useHomeStore = create<HomeState>((set, get) => ({
    ...baseState<HomeState>(set, get),
}))