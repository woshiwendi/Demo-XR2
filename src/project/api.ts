// custom imports
import { projectType } from "./types"
import { defaultFetchHeaders, constructUrl } from "../utils"

const projUrl = `${process.env.REACT_APP_BACKEND_URL}/proj`

export async function getProject(id: string): Promise<projectType> {
    return await (await fetch(constructUrl(projUrl, {id}), {
        method: "GET", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })).json()
}

export async function createProject(uid: string): Promise<projectType> {
    return await (await fetch(constructUrl(`${projUrl}/create`, {uid}), {
        method: "POST", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })).json() as projectType
}

export async function deleteProject(id: string) {
    await fetch(constructUrl(`${projUrl}/delete`, {id}), {
        method: "DELETE", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })
}

export async function editProject(id: string, title: string) {
    if (!id || !title) return 

    await fetch(constructUrl(`${projUrl}/edit`, {pid: id, title}), {
        method: "PUT", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })
}