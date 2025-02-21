// custom imports
import { prepareNodesForSave } from "./utils"
import { mbType, nodeType, edgeType, nodeStatusType, nodeDataType } from "./types"
import { constructUrl, filterObj, addToLocalStorage, resizeImage, defaultFetchHeaders, getCookie } from "../utils"

// third party
import { Edge } from "@xyflow/react"
import { generateUUID } from "three/src/math/MathUtils"

const mbUrl = `${process.env.REACT_APP_BACKEND_URL}/mb`
const dataUrl = `${process.env.REACT_APP_BACKEND_URL}/data`

export async function getMoodboard(id: string): Promise<mbType> {
    localStorage.removeItem(id)
    
    const mb = await (await fetch(constructUrl(mbUrl, {id}), {
        method: "GET", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })).json()

    return mb
}

export async function getNodeData(id: string): Promise<nodeDataType> {
    return await (await fetch(constructUrl(dataUrl, {id}), {
        method: "GET", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })).json()
}

export async function getNodeStatus(id: string): Promise<{status: nodeStatusType}> {
    return await (await fetch(constructUrl(`${dataUrl}/status`, {id}), {
        method: "GET", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })).json() as {status: nodeStatusType}
}

export async function createMoodboard(pid: string): Promise<mbType | void> {
    return await (await fetch(constructUrl(`${mbUrl}/create`, {pid}), {
        method: "POST", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })).json()
}

export async function deleteMoodboard(id: string) {
    await fetch(constructUrl(`${mbUrl}/delete`, {id}), {
        method: "DELETE", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })
}

export async function editMoodboard(
    id: string, 
    title: string, 

    nodes: nodeType[] = [],
    edges: edgeType[] = []
): Promise<mbType | void> {
    const mb = await (await fetch(constructUrl(`${mbUrl}/edit`, {id, title}), {
        method: "PUT", 
        body: JSON.stringify({
            nodes: prepareNodesForSave(nodes, ["playground", "img"], {id: generateUUID()}), 
            edges,
        }), 
        credentials: "include",
        headers: defaultFetchHeaders()
    })).json()

    return mb
}

export async function runPath(mid: string, path: [nodeType, Edge[], boolean][]): Promise<[string, nodeStatusType][]> {
    path = path.map(([node, edges, reRun]) => ([{...node, data: filterObj<nodeDataType>(node.data, ["playground", "img"])}, edges, reRun]))

    const nodeStatus = await (await fetch(constructUrl(`${dataUrl}/runPath`, {mid, is_demo: process.env.REACT_APP_IS_DEMO}), {
        method: "POST", 
        credentials: "include",
        body: JSON.stringify(path),
        headers: defaultFetchHeaders()
    })).json() as [string, nodeStatusType][]

    return nodeStatus
}

export async function captionNode(nid: string): Promise<void> {
    await fetch(constructUrl(`${dataUrl}/node/caption`, {nid}), {
        method: "POST", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })
}

export async function uploadImg(mid: string, id: string, img: File): Promise<string | void> {
    console.log(`[uploadImg] >> uploading image (${img.size} bytes)...`)
    const data = new FormData()
    data.set("img", img)

    const url = await (await fetch(constructUrl(`${dataUrl}/img/upload`, {id}), {
        body: data,
        method: "POST", 
        credentials: "include",
        headers: {
            "X-CSRFToken": getCookie("csrftoken")
        }
    })).json()
    return url
}

export async function deleteImg(mid: string, id: string): Promise<void> {
    await fetch(constructUrl(`${dataUrl}/img/delete`, {id}), {
        method: "DELETE", 
        credentials: "include",
        headers: defaultFetchHeaders()
    })
}

/*** Unsecure ***/
export async function editMoodboardUnsecure(
    id: string, 

    nodes: nodeType[] = [], 

): Promise<void> {
    if (!nodes.length) return
    
    await fetch(constructUrl(`${mbUrl}/edit/unsecure`, {id}), {
        method: "PUT", 
        body: JSON.stringify(prepareNodesForSave(nodes, ["playground", "img"], {id: generateUUID()}))
    })
}