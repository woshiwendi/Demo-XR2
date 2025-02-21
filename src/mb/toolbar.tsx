// custom imports
import { selector } from "./state"
import { useToolbar } from "./hooks"
import { useMoodboardStore } from "./state/store"
import { useUserStore } from "../user/state/store"
import { selector as userSelector } from "../user/state"

// static data
import toolbarData from "../assets/data/nodes.json"

// third party
import { useShallow } from "zustand/shallow"
import { generateUUID } from "three/src/math/MathUtils"
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

type MoodboardToolbarProps = JSX.IntrinsicElements["div"] & {  
}

export function MoodboardToolbar({...props}: MoodboardToolbarProps) {
    const { add } = useToolbar()

    const { perms } = useMoodboardStore(useShallow(selector))
    const { isAuthenticated } = useUserStore(useShallow(userSelector))
    
    return (
        <div className="node-toolbar flex justify-between align-center">
            {[toolbarData.input, toolbarData.output, toolbarData.show].map(tools => {
                return (
                    <div key={generateUUID()} className="node-toolbar-cont">
                        {Object.entries(tools).map(([type, tool]) => {
                            const isEditor = perms?.isOwner || perms?.isEditor
                            const disabled = tool.disabled || ((!isAuthenticated || !isEditor) && tool.authOnly)

                            return (
                                <button 
                                    disabled={disabled}
                                    key={`${type}-create-btn`} 
                                    onClick={() => add(type, tool)} 
                                    className={`icon-button ${disabled ? "disabled" : ""}`} 
                                >
                                    <FontAwesomeIcon icon={tool.icon as IconProp} />
                                    <span className="tooltip">{tool.tooltip}</span>
                                </button>
                        )})}
                    </div>
                )
            })}

            <button 
                disabled
                className={`icon-button disabled"`} 
            >
                <FontAwesomeIcon icon={"fa-solid fa-ellipsis-vertical" as IconProp} />
                <span className="tooltip">coming soon!</span>
            </button>
        </div>
    )
}
