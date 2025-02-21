// custom imports
import DefaultNav from "../nav";
import Project from "../project";
import { NavCrumbs } from "../nav/utils";
import { useHomeStore } from "./state/store";
import Projects from "../components/projects";
import { LoadingBar } from "../components/loading";
import { useUserStore } from "../user/state/store";
import { selector as homeSelector } from "./state";
import { selector as userSelector } from "../user/state";

// static data
import navData from '../assets/data/nav.json';

// third party
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// css stylesheets
import '../assets/css/home.css';
import { useShallow } from "zustand/shallow";

type HomeProps = JSX.IntrinsicElements["div"] & {
    projects?: boolean
}

export default function Home({projects, ...props}: HomeProps) {
    const params = useParams()
    const navigate = useNavigate()
    
    const user = useUserStore(useShallow(userSelector))
    const { loading, setLoading } = useHomeStore(useShallow(homeSelector))

    const initialize = async () => {
        setLoading({on: true, progressText: "Initializing..."})
        user.init()
        setLoading({on: false, progressText: ""})
    }
    
    useEffect(() => { initialize() }, [])

    useEffect(() => {
        if (params.projectId) return

        if (user.isAuthenticated) {
            navigate(`/${user.id}`)
        } else {
            navigate("/")
        }
    }, [user.isAuthenticated])

    return (
        <>
            <DefaultNav user={user} data={navData.home}/>

            <div id="home-content">
                {/* <p className="saving">{global.saving? "Saving..." : ""}</p> */}
                {loading.on && <LoadingBar progressText={loading.progressText} style={{top: "var(--nav-top)"}}/>}
                <NavCrumbs defaultCrumbs={params.projectId ? [{id: "home", title: "All Projects", href: `/${user.id}`}] : undefined}/>
                <section>{/* actions */}</section>

                {projects && 
                    <>
                    <h1 className="cursor-default">All Projects</h1>
                    <Projects /> 
                    </>
                }

                {params.projectId && <Project id={params.projectId}/>}
            </div>
        </>
    )
}
