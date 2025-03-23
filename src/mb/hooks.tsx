// custom imports
import { selector } from "./state"
import { nodeType } from "./types"
import { initNodeStatus } from "./nodes"
import { NodeInputMissing } from "./errors"
import { captionNode, runPath } from "./api"
import { useMoodboardStore } from "./state/store"
import { useUserStore } from "../user/state/store"
import { downloadZip, filter, find } from "../utils"
import { extTypes, downloadFileType } from "../types"
import { meshDownloadFiles } from "../playground/utils"
import { selector as userSelector } from "../user/state"

// third party
import { useShallow } from "zustand/shallow"
import { generateUUID } from "three/src/math/MathUtils"
import { Edge, getViewportForBounds, useReactFlow } from "@xyflow/react"

export function useNodeActions() {
    const { id: uid, name } = useUserStore(useShallow(userSelector))
    const { id: mid, nodes, perms, getPath, addNode, updateNode } = useMoodboardStore(useShallow(selector));

    const run = (id: string, uid: string, reRun: boolean = false) => {
        try {
            if (!perms?.isOwner && !perms?.isEditor) return 
            // setNodeStatus(id, "pending")
            const path: [nodeType, Edge[]][] = getPath(id) as [nodeType, Edge[]][]
            runPath(mid, path)
            updateNode(id, {reRun: false})
        } catch (error) {
            if (error instanceof NodeInputMissing) {
                return console.error(error.message)
            }
            throw error
        }
    }

    const download = async (id: string) => {
        const node = find<nodeType>(nodes, {id}, ['id'])
        if (!node) {
            console.warn(`[download] >> node ${id} not found`)
            return
        }

        let files: downloadFileType[] = []
        switch (node.type) {
            case "generatedImg":
                const img = node.data.img

                if (typeof img === "string") {
                    files.push({url: img, title: node.data.title, ext: "png"})
                } else {
                    console.warn(`[download] >> node ${id} img is not a url`)
                }
                break
            case "mesh":
                const mesh = node.data.playground?.meshes[0]
                if (mesh) {
                    files = await meshDownloadFiles(mesh)

                } else {
                    console.warn(`[download] >> node ${id} has no mesh`)
                }
                break
            default:
                console.warn(`[download] >> node ${id} type ${node.type} not supported`)
                return
        }

        if (files) {
            downloadZip(files)
        }
    }

    const caption = (id: string) => {
        const node = find<nodeType>(nodes, {id}, ['id'])
        if (!node?.data.img) return 
        captionNode(id)
    }

    const getHref = (id: string) => {
        const node = find<nodeType>(nodes, {id}, ['id'])
        switch (node?.type) {
            case "mesh":
                return node.data.playground? `/${uid || "anon"}/playground/${node.data.playground.id}` : undefined
            default:
                return
        }
    }

    return { run, download, caption, getHref }
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
                },
                dragHandle: ["txt"].includes(type) ? ".drag-handle__custom" : undefined
            },
            initNodeStatus[type] || "static",
            uid ? { id: uid, name } : undefined
        )

        setViewport({x: vx, y: vy, zoom: zoom})

        select(nid)

    }

    return { add }
}