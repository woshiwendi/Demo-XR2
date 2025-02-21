// custom imports
import DefaultNav from "../nav"
import useSocket from "./socket"
import { nodeTypes } from "./nodes"
import { getMoodboard } from "./api"
import { copyToClipboard } from "../utils"
import { MoodboardToolbar } from "./toolbar"
import { LoadingBar } from "../components/loading"

import { selector as mbSelector } from "./state"
import { useMoodboardStore } from "./state/store"

import { useUserStore } from "../user/state/store"
import { selector as userSelector } from "../user/state"

// static data
import navData from '../assets/data/nav.json'

// third party
import { useEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { useShallow } from "zustand/shallow"
import { Background, BackgroundVariant, Controls, DefaultEdgeOptions, MiniMap, ProOptions, ReactFlow } from "@xyflow/react"

// css sheets
import "../assets/css/mb.css"

type MoodboardProps = JSX.IntrinsicElements["div"] & {
}

const proOptions: ProOptions = { hideAttribution: true } 
const edgeOptions: DefaultEdgeOptions = {}

export default function Moodboard({...props}: MoodboardProps) {
    const {
        id,
        title, 
        nodes,
        edges,

        loading,
        setLoading,

        perms,
        owner,
        
        init, 
        initPerms,

        nodeStatus,
        setNodeMode,
        setNodeStatus,
        
        selected, 
        select,
        unselect, 
        
        addNode,
        pushNode,
        pushNodeData,
        updateNodeData,

        getPath,
        isValidPath,
        
        save,
        ...flowProps
    } =  useMoodboardStore(useShallow(mbSelector))

    const { undo, redo, clear } = useMoodboardStore.temporal.getState() 

    const params = useParams()
    const user = useUserStore(useShallow(userSelector))
    
    const mbId = params.mbId
    const socket = useSocket()
    
    const initialzie = async () => {
        if (mbId) {
            setLoading({on: true, progressText: "initializing..."})
            init(await getMoodboard(mbId))
            setLoading({on: false, progressText: ""})
        }
    }

    useEffect(() => { if (user.isAuthenticated && id) initPerms() }, [user.isAuthenticated, id])
    
    useEffect(() => { document.title = `${title} - Sponj3d` || "Sponj3d"}, [title])

    useEffect(() => { initialzie() }, [perms])

    useEffect(() => { 
        if (!user.id) {
            user.init(); 
        }
        document.addEventListener("keydown", (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "z") {
                undo()
            } else if (event.shiftKey && (event.ctrlKey || event.metaKey) && event.key === "z") {
                redo()
            } 
        })
    }, [])

    return (
        <div {...props} className="height-100 width-100">
            {loading.on && <LoadingBar progressText={loading.progressText} style={{top: "var(--nav-top)"}}/>}
            <DefaultNav 
                user={user} 
                style={{zIndex: 1, right: 'var(--nav-left)', left: "auto"}}
            >
                <button 
                    className="mb-save-btn"
                    onClick={() => {copyToClipboard(window.location.href)}}
                >
                    Share
                </button>
            </DefaultNav>
            <ReactFlow
                fitView
                panOnScroll
                nodes={nodes}
                edges={edges}
                {...flowProps}
                minZoom={0.001}
                selectionOnDrag
                panOnDrag={[1, 2]}
                nodeTypes={nodeTypes}
                proOptions={proOptions}
                defaultEdgeOptions={edgeOptions}
                onClick={(event) => {
                    if ((event.target as any).getAttribute("class")?.startsWith("react-flow__pane")) {
                        unselect()
                    }
                }}
                className="validationflow"
            >
                <MiniMap position="top-left"/>
                <Controls position="bottom-right"/>
                <Background variant={BackgroundVariant.Dots} />
            </ReactFlow>
        
            <MoodboardToolbar />
        </div>
    )
}
