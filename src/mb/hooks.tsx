// custom imports
import { nodeType } from "./types"
import { selector } from "./state"
import { initNodeStatus } from "./nodes"
import { NodeInputMissing } from "./errors"
import { captionNode, runPath } from "./api"
import { useMoodboardStore } from "./state/store"
import { useUserStore } from "../user/state/store"
import { downloadImg, filter, find } from "../utils"
import { selector as userSelector } from "../user/state"

// third party
import { useShallow } from "zustand/shallow"
import { generateUUID } from "three/src/math/MathUtils"
import { Edge, getViewportForBounds, useReactFlow } from "@xyflow/react"

export function useNodeActions() {
    const { id: uid, name } = useUserStore(useShallow(userSelector))
    const { id: mid, nodes, perms, nodeStatus, getPath, setNodeStatus, addNode } = useMoodboardStore(useShallow(selector));

    const run = (id: string, uid: string, reRun: boolean = false) => {
        try {
            if (!perms?.isOwner && !perms?.isEditor) return 
            // setNodeStatus(id, "pending")
            const path: [nodeType, Edge[], boolean][] = getPath(id).map(([node, edges]) => ([
                {...node, status: nodeStatus.get(node.id)} as nodeType, edges, reRun
            ]))
            
            runPath(mid, path)
        } catch (error) {
            if (error instanceof NodeInputMissing) {
                return console.error(error.message)
            }
            throw error
        }
    }

    const download = (id: string) => {
        const node = find<nodeType>(nodes, {id}, ['id'])
        if (!node) {
            console.warn(`[download] >> node ${id} not found`)
            return
        }

        let url: string | undefined = undefined
        let ext: "png" | "obj" | undefined = undefined
        switch (node.type) {
            case "generatedImg":
                const img = node.data.img

                if (typeof img === "string") {
                    url = img
                    ext = "png"
                } else {
                    console.warn(`[download] >> node ${id} img is not a url`)
                }
                break
            case "mesh":
                const mesh = node.data.playground?.meshes[0]
                if (mesh) {
                    ext = "obj"
                    url = mesh.url
                } else {
                    console.warn(`[download] >> node ${id} has no mesh`)
                }
                break
            default:
                console.warn(`[download] >> node ${id} type ${node.type} not supported`)
                return
        }

        if (url) {
            downloadImg(url, node.data.title, ext)
        }
    }

    const caption = (id: string) => {
        const node = find<nodeType>(nodes, {id}, ['id'])
        if (!node?.data.img) return 
        captionNode(id)
    }

    return { run, download, caption }
}

export function useToolbar() {
    const { screenToFlowPosition, setViewport, getViewport } = useReactFlow()
    const { id: uid, name } = useUserStore(useShallow(userSelector))
    const { perms, nodes, addNode, select } = useMoodboardStore(useShallow(selector))

    const add = (type: string, tool: {tooltip: string, icon: string, disabled: boolean}) => {
        if (type !== "comment" && !perms?.isOwner && !perms?.isEditor) return 

        const nid = generateUUID()
        const x = window.innerWidth / 2
        const y = window.innerHeight / 2
        const center = screenToFlowPosition({ x: x, y: y })
        
        const { x: vx, y: vy, zoom } = getViewportForBounds(
            {
                x: center.x,
                y: center.y,
                width: 300,
                height: 300,
            },
            window.innerWidth,
            window.innerHeight,
            1.5,
            1.5, 
            9
        );

        addNode(
            {
                type, 
                id: nid, 
                position: center, 
                data: {
                    src: "",
                    id: generateUUID(), 
                    title: `${tool.tooltip} ${filter(nodes, {type}, ['type'], undefined, eq => eq).length}`,
                }
            },
            initNodeStatus[type] || "static",
            uid ? { id: uid, name } : undefined
        )

        setViewport({x: vx, y: vy, zoom: zoom})

        select(nid)

    }

    return { add }
}