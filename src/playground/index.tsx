// custom imports
import XCanvas from "./canvas"
import DefaultNav from "../nav"
import useSocket from "./socket"
import { PlaygroundPanel } from "./panel"
import ModeControls from "./controls/mode"
import { navStateType } from "../nav/types"
import { PlaygroundToolbar } from "./toolbar"
import { find, useCustomState } from "../utils"
import { getPlayground, initMesh } from "./api"
import { useUserStore } from "../user/state/store"
import { usePlaygroundStore } from "./state/store"
import { LoadingBar } from "../components/loading"
import { MeshControls } from "./controls/meshControls"
import { selector as playgroundSelector } from "./state"
import { selector as userSelector } from "../user/state"
import { PlaygroundToolbarControls } from "./controls/toolbarControls"

// static data
import navData from "../assets/data/nav.json"

// third party
import { useRef, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useShallow } from "zustand/shallow"

// css stylesheets
import '../assets/css/playground.css'
import { meshType } from "./types"

type PlaygroundProps = JSX.IntrinsicElements["div"] & {
}

export default function Playground(props: PlaygroundProps) {
    const params = useParams()
    const user = useUserStore(useShallow(userSelector))
    const {
        id, 
        mode,
        chats,
        title,
        meshes, 
        loading,
        selected,

        init,

        addMesh, 
        deleteMesh,
        updateMesh,
        updateMeshParams,

        setLoading,

        ...playground
    } = usePlaygroundStore(useShallow(playgroundSelector))
    const [activeNav, setActiveNav] = useCustomState<navStateType>(navData.playground[0] as navStateType)
    
    const plid = params.plid
    const socket = useSocket()

    const loadMesh = async (mesh: meshType) => {
        setLoading({on: true, progressText: `Loading Mesh ${mesh.title}...`})
        if (mesh.isCurrent) {
            addMesh(await initMesh(mesh.id))
        } else {
            addMesh(mesh)
        }
        setLoading({on: false, progressText: undefined})
    }

    const initialzie = async () => {
        if (plid) {
            init({id: plid, title: "", meshes: []})
            
            setLoading({on: true, progressText: "Initializing..."})
            const meshes = (await getPlayground(plid)).meshes
            
            for (let i = 0; i < meshes.length; i++) {
                loadMesh(meshes[i])
            }
            // setLoading({on: false, progressText: undefined})
        }
    }

    useEffect(() => { document.title = `${title} - Sponj3d` || "Sponj3d"}, [title])    
    useEffect(() => { initialzie() }, [user.isAuthenticated])

    useEffect(() => { user.init() }, [])

    // all control editing needs to be handled here and it will not know about the changes in the canvas, but that is fine it does not need to. 
    
    return (
        <div id="canvas-container" className='height-100'>
            <XCanvas mode={mode} meshes={meshes}><></></XCanvas>

            {/* Playground Nav */}
            {/* <DefaultNav 
                user={user} 
                style={{zIndex: 1}}
            />   */}
            
            <ModeControls/>
            <PlaygroundPanel />
            {loading.on && <LoadingBar progressText={loading.progressText} />}

            {selected.length === 1 && <MeshControls />}
            <PlaygroundToolbar />
            <PlaygroundToolbarControls />
        </div>
    )
}