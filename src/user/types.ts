import { projectType } from "../project/types"

export type userType = {
    id: string
    name: string
    email: string
    password?: string

    created_at?: string
    updated_at?: string

    projects?: projectType[]
}

export type permsType = {
    isOwner: boolean
    isEditor: boolean
    isViewer: boolean
}