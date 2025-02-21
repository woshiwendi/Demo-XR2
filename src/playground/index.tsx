// custom imports
import XCanvas from "./canvas"
import DefaultNav from "../nav"
import { getPlayground } from "./api"
import { PlaygroundPanel } from "./panel"
import ModeControls from "./controls/mode"
import { navStateType } from "../nav/types"
import { PlaygroundToolbar } from "./toolbar"
import { find, useCustomState } from "../utils"
import { useUserStore } from "../user/state/store"
import { usePlaygroundStore } from "./state/store"
import { LoadingBar } from "../components/loading"
import { MeshControls } from "./controls/meshControls"
import { selector as playgroundSelector } from "./state"
import { selector as userSelector } from "../user/state"

// static data
import navData from "../assets/data/nav.json"

// third party
import { useRef, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useShallow } from "zustand/shallow"

// css stylesheets
import '../assets/css/playground.css'

type PlaygroundProps = JSX.IntrinsicElements["div"] & {
}

export default function Playground(props: PlaygroundProps) {
    const params = useParams()
    const user = useUserStore(useShallow(userSelector))
    const {
        id, 
        mode,
        // tool,
        title,
        meshes, 
        loading,
        selected,

        init,

        addMesh, 
        deleteMesh,
        updateMesh,

        setLoading,

        ...playground
    } = usePlaygroundStore(useShallow(playgroundSelector))
    const [activeNav, setActiveNav] = useCustomState<navStateType>(navData.playground[0] as navStateType)
    
    const plid = params.plid
    const socket = useRef<WebSocket>()

    const initialzie = async () => {
        if (plid) {
            init({id: plid, title: "", meshes: []})
            
            setLoading({on: true, progressText: "Initializing..."})
            const meshes = (await getPlayground(plid)).meshes
            meshes.forEach(mesh => addMesh(mesh))
            setLoading({on: false, progressText: ""})
        }
    }

    useEffect(() => { document.title = `${title} - Sponj3d` || "Sponj3d"}, [title])

    useEffect(() => {
        initialzie()
        if (user.isAuthenticated) {
            const sock = new WebSocket(`${process.env.REACT_APP_WS_URL}/user/${user.id}`)
            sock.onmessage = (event) => {
                const {type, mid, data} = JSON.parse(event.data)
                switch (type) {
                    case "meshUpdate":
                        if (find(meshes, {id: mid}, ['id'])) {
                            setLoading({on: true, progressText: "Re-initializing..."})
                            updateMesh(mid, data)
                            setLoading({on: false, progressText: ""})
                        }
                        break
                    default:
                        console.log(`[onmessage] >> got message of type ${type}`)
                        break
                }
            }
            socket.current = sock
        }
    }, [user.isAuthenticated])

    useEffect(() => { user.init() }, [])

    // all control editing needs to be handled here and it will not know about the changes in the canvas, but that is fine it does not need to. 
    
    return (
        <div id="canvas-container" className='height-100'>
            <XCanvas mode={mode} meshes={meshes}><></></XCanvas>

            {/* Playground Nav */}
            <DefaultNav 
                user={user} 
                style={{zIndex: 1, right: 'var(--nav-left)', left: "auto"}}
            >
                <button 
                    className="mb-save-btn"
                    onClick={async () => {}}
                >
                    Share
                </button>
            </DefaultNav>   
            
            <ModeControls/>
            <PlaygroundPanel />
            {loading.on && <LoadingBar progressText={loading.progressText} />}

            {selected.length === 1 && <MeshControls />}
            <PlaygroundToolbar />
        </div>
    )
}