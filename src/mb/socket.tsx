// custom imports
import { selector } from "./state"
import { useMoodboardStore } from "./state/store"
import { useUserStore } from "../user/state/store"
import { selector as userSelector } from "../user/state"

// third party
import { useEffect, useRef } from "react"
import { useShallow } from "zustand/shallow"


export default function useSocket() {
    const { id: uid } = useUserStore(useShallow(userSelector))
    const { nodes, updateNode, updateNodeData, init, addNode, perms } = useMoodboardStore(useShallow(selector))

    const socket = useRef<WebSocket>()

    useEffect(() => {
        if (perms?.isEditor || perms?.isOwner) {
            const sock = new WebSocket(`${process.env.REACT_APP_WS_URL}/user/${uid}`)
            sock.onmessage = async (event) => {
                const {type, nid, status, data} = JSON.parse(event.data)
                console.log(`[onmessage] >> got message of type ${type} for ${nid || ""} [${status || ""}]`)
                // console.log(`[onmessage] (data) >>`, data)
                
                switch (type) {
                    case "nodeUpdate":
                        if (nid && status) {
                            updateNode(nid, {status})
                            if (data) updateNodeData(nid, data, false)
                        }
                        break
                    case "moodboardUpdate":
                        if (data) init(data)
                        break
                    case "nodeAdd":
                        if (data) addNode(data, data.status, data.owner, false)
                        break
                    default:
                        console.warn(`[onmessage] >> got message of type ${type}`)
                        break
                }
            }
            
            socket.current = sock
            setInterval(() => {
                if (socket.current?.readyState === 1) socket.current.send(JSON.stringify({"signal": "heartbeat"}))
            }, 10000)
        }
    }, [perms])

    return { socket }
}