// custom imports
import { EditableH3 } from "./editable"
import { navStateType } from "../nav/types"
import { projectType } from "../project/types"
import { useUserStore } from "../user/state/store"
import { ProjectThumbnail } from "../project/thumbnail"
import { selector as userSelector } from "../user/state"
import { createProject, editProject } from "../project/api"

// third party
import { useShallow } from "zustand/shallow"
import { useLocation, useNavigate } from "react-router-dom"
import { elapsedTime } from "../utils"

type ProjectsProps = JSX.IntrinsicElements["section"] & {
}

export default function Projects({...props}: ProjectsProps) {
    const navigator = useNavigate()
    const state = useLocation().state as navStateType
    const { id: uid, projects, isAuthenticated } = useUserStore(useShallow(userSelector))
   
    return (
        <section className="flex align-center flex-wrap">
            {projects?.map((project) => {
                const href = `/${uid}/project/${project.id}`
                const updatedAt = new Date(project.updatedAt!)

                return (
                    <ProjectThumbnail 
                        key={project.id} 
                        project={project as projectType}
                        
                        to={href}
                        state={{
                            href: href, 
                            id: project.id, 
                            prevState: {
                                id: "", 
                                title: "All Projects",
                                href: window.location.href, 
                            },
                            title: project.title, 
                        }}
                    >
                        {/* <h3 style={{fontWeight: 550, margin: "10px 0 0 10px"}}>{project.title}</h3> */}
                        <EditableH3 
                            value={project.title}
                            onTypingStopped={header => { editProject(project.id, header) }}
                        />
                        <p style={{margin: "10px 0 0 10px"}}>{project.mbs.length} mood boards · Updated {elapsedTime(updatedAt)} ago</p>
                    </ProjectThumbnail>
                )
            })}

            <ProjectThumbnail 
                disabled={!isAuthenticated}
                onAdd={async () => {
                    if (!uid) return
                    const project = await createProject(uid)

                    const href = `/${uid}/project/${project.id}`
                    navigator(href, {state: {id: project.id, title: project.title, prevState: state, href: href}})
                }}
                
                to={""}
                mbClassName="mb-filled" 
                contStyle={{backgroundColor: "var(--bg-secondary)"}}
            >
                {/* <h3 style={{fontWeight: 550, margin: "10px 0 0 10px"}}>Let's create a project!</h3> */}
                <EditableH3 disabled value={"Let's create a project!"}/>
                {/* <p style={{margin: "10px 0 0 10px"}}>Get unlimited everything on professional plan</p> */}
            </ProjectThumbnail>
        </section>
    )
}