// custom imports
import { selector } from "./state";
import { mbType } from "../mb/types";
import { editProject } from "./api";
import { navStateType } from "../nav/types";
import { useProjectStore } from "./state/store";
import MoodboardThumbnail from "../mb/thumbnail";
import { useUserStore } from "../user/state/store";
import { LoadingBar } from "../components/loading";
import { createMoodboard, editMoodboard } from "../mb/api";
import { selector as userSelector } from "../user/state/index";
import { EditableH1, EditableH3 } from "../components/editable";

// third party
import { useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { useLocation, useNavigate } from "react-router-dom";

import "../assets/css/project.css"; 
import { elapsedTime } from "../utils";

type ProjectProps = JSX.IntrinsicElements["section"] & {
}

export default function Project({id, ...props}: ProjectProps) {
    const navigator = useNavigate()
    const { id: uid, isAuthenticated } = useUserStore(useShallow(userSelector))
    const { mbs, title, init, loading, setLoading } = useProjectStore(useShallow(selector))

    
    const state = useLocation().state as navStateType
    useEffect(() => {init(id!)}, [id])

    return (
        <div>
            {loading.on && <LoadingBar progressText={loading.progressText} style={{top: "var(--nav-top)"}}/>}
            <EditableH1 
                value={title}
                disabled={!isAuthenticated}
                onTypingStopped={(header) => {
                    if (id) {
                        setLoading({on: true, progressText: "Saving..."})
                        editProject(id, header)
                        setLoading({on: false, progressText: undefined})
                    }
                }}
            />
            <section className="flex align-center flex-wrap">
                {mbs?.map((mb, i) => {
                    const updatedAt = new Date(mb.updatedAt!)
                    return (
                        <MoodboardThumbnail 
                            key={mb.id}
                            mb={mb as mbType} 
                            to={`/${uid}/mb/${mb.id}`} 
                            contClassName="mb-filled-secondary"
                            state={{id: mb.id, title: mb.title, prevState: state}}
                        >
                            <EditableH3 
                                value={mb.title}
                                onTypingStopped={(header) => {
                                    setLoading({on: true, progressText: "Saving..."})
                                    editMoodboard(mb.id, header) 
                                    setLoading({on: false, progressText: undefined})
                                }}
                            />
                            <p style={{margin: "10px 0 0 10px"}}>Updated {elapsedTime(updatedAt)} ago</p>
                        </MoodboardThumbnail>
                    )
                })}

                <MoodboardThumbnail 
                    onAdd={async () => {
                        if (!id) return
                        const mb = await createMoodboard(id)
                        if (!mb) return

                        const href = `/${uid}/mb/${mb.id}`
                        navigator(href, {state: {id: mb.id, title: mb.title, prevState: state, href: href}})
                    }}

                    off
                    to={""}
                    disabled={!isAuthenticated}
                    contClassName="mb-thumbnail dashed"
                />
            </section>
        </div>
    )
}