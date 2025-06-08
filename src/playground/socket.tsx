// custom imports
import { selector } from "./state"
import { usePlaygroundStore } from "./state/store"
import { useUserStore } from "../user/state/store"
import { selector as userSelector } from "../user/state"

// third party
import { useEffect, useRef } from "react"
import { useShallow } from "zustand/shallow"


export default function useSocket() {
    const { id: uid, isAuthenticated } = useUserStore(useShallow(userSelector))
    const { id: pid, updateMesh, addMesh  } = usePlaygroundStore(useShallow(selector))

    const socket = useRef<WebSocket>()

    useEffect(() => {
        if (isAuthenticated) {
            const sock = new WebSocket(`${process.env.REACT_APP_WS_URL}/user/${uid}`)
            sock.onmessage = (event) => {
                const notifications = []
                const socketMessage = JSON.parse(event.data)
                console.debug(`[onmessage] (socketMessage) >>`, socketMessage)
                if (socketMessage.batch) {
                    notifications.push(...socketMessage.notifications)
                } else {
                    notifications.push(socketMessage)
                }

                for (const {type, mid, data, ...notification}  of notifications) {
                    switch (type) {
                        case "meshUpdate":
                            updateMesh(mid, data, false)
                            break
                        case "meshAdd":
                            if (notification.pid === pid) {
                                addMesh(data)
                            }
                            break
                        default:
                            console.log(`[onmessage] >> got message of type ${type}`)
                            break
                    }
                }
            }
            socket.current = sock
            // setInterval(() => {
            //     if (socket.current?.readyState === 1) socket.current.send(JSON.stringify({"signal": "heartbeat"}))
            // }, 10000)
        }
    }, [isAuthenticated])

    return { socket }
}