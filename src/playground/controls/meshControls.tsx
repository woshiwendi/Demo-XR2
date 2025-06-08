// custom imports
import { MeshChat } from './chat';
import { selector } from '../state';
import { usePlaygroundStore } from '../state/store';
import { Editable } from '../../components/editable';

// third party
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';

// static data
import playgroundData from '../../assets/data/playground.json';

// css stylesheets
import '../../assets/css/controls.css'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type MeshControlsProps = JSX.IntrinsicElements['div'] & {
}

// TODO: refactor to allow for different control modes and render component for each 
// there is: chat, settings
export function MeshControls({...props}: MeshControlsProps) {
    const { tool, updateMesh, selected, getMesh } = usePlaygroundStore(useShallow(selector))
    
    const id = useMemo(() => selected[0], [selected])
    const mesh = useMemo(() => {
        try {
            return getMesh(id)

        } catch (error) {
            console.error(error)
            return undefined
        }
    }, [selected])

    const [mode, setMode] = useState<"chat" | "settings">("chat")
    
    return (
        <>
        {mesh &&
            <div id="mesh-controls">
                <div></div>
                <div className='nav-panel' style={{borderBottom: "1px solid var(--bg-primary)", padding: "1px 5px"}}>
                    {Object.entries(playgroundData.meshControls).map(([type, tool]) => { 
                        return (
                            <button 
                                key={`${type}-create-btn`} 
                                onClick={() => setMode(type as any)}
                                className={`icon-button ${tool.disabled ? "disabled" : ""} ${mode === type ? "active" : ""}`} 
                            >
                                {/* <FontAwesomeIcon key={type} icon={tool.icon as any} />
                                <span className="tooltip">{tool.tooltip}</span> */}
                                {tool.title}
                            </button>
                        )
                    })}
                </div>
                
                <div style={{padding: "0 10px 0 15px", height: "calc(100% - 36px - 1em)"}}>
                    <h3><b>{playgroundData.meshControls[mode].title}</b></h3>
                    {mode === "chat" && <MeshChat meshId={id}/>}
                    {mode === "settings" && <MeshSettings meshId={id}/>}
                </div>
            </div>
        }
        </>
    )
}

type MeshSettingsProps = JSX.IntrinsicElements['div'] & {
    meshId: string
}

function MeshSettings({meshId, className = "", style, ...props}: MeshSettingsProps) {
    const { updateMesh, getMesh } = usePlaygroundStore(useShallow(selector))
    
    const mesh = useMemo(() => getMesh(meshId), [meshId])

    return (
        <div className={`overflow-scroll ${className}`} style={{height: "calc(100% - 2em - 16.8px)", ...style}}>
            <div {...props} className={`mesh-settings`}>
                <Editable 
                    value={mesh.title}
                    className="mesh-title"
                    onTypingStopped={(header) => {
                        updateMesh(meshId, {title: header})
                    }}
                    onKeyDown={event => event.stopPropagation()}
                />
            </div>
        </div>
    )
}