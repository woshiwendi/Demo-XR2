import { mbMetaType } from "../mb/types"

export type projectType = {
    id: string
    title: string
    mbs: mbMetaType[]
    updatedAt?: string
}