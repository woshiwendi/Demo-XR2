// custom imports
import { meshType, playgroundType } from "./types"
import { constructUrl, defaultFetchHeaders, getCookie } from "../utils"

const playgroundUrl = `${process.env.REACT_APP_BACKEND_URL}/playground`

export async function getPlayground(id: string): Promise<playgroundType> {
    return await (await fetch(constructUrl(playgroundUrl, {id}), {
        method: "GET", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })).json()
}

export async function segmentMesh(uid: string, mid: string): Promise<void> {
    await fetch(constructUrl(`${playgroundUrl}/mesh/segment`, {uid, mid}), {
        method: "POST",
        credentials: "include",
        headers: defaultFetchHeaders()
    })
}

export async function editMesh(id: string, data: Partial<meshType>): Promise<meshType> {
    return await (await fetch(`${playgroundUrl}/mesh/edit`, {
        method: "PUT", 
        credentials: "include",
        headers: defaultFetchHeaders(),
        body: JSON.stringify({id, ...data}),
    })).json()
}

export async function getMesh(id: string): Promise<meshType> {
    return await (await fetch(constructUrl(`${playgroundUrl}/mesh`, {id}), {
        method: "GET", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })).json()
}

export async function initMesh(id: string): Promise<meshType> {
    const mesh = await getMesh(id)

    const segments = []
    for (let i = 0; i < mesh.segments.length; i++) {
        segments.push(await initMesh(mesh.segments[i].id))
    }

    mesh.segments = segments
    // TODO: temperary until we update backend to support vertex selection
    return {
        ...mesh,
        unselected: {
            faces: mesh.faces,
            colors: mesh.colors,
            vertices: mesh.vertices,
        },

        selected: {id: `${id}-selected`},
    } as meshType
} 

export async function uploadMesh(pid: string, file: File): Promise<void> {
    const data = new FormData()
    data.set("mesh_file", file)

    await fetch(constructUrl(`${playgroundUrl}/mesh/upload`, {pid}), {
        method: "POST", 
        credentials: "include",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: data
    })
}