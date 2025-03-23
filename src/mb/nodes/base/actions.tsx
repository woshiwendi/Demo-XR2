// custom imports
import { selector } from "../../state"
import { useNodeActions } from "../../hooks"
import { useMoodboardStore } from "../../state/store"
import { nodeModeTypes, nodeStatusType, nodeTypes } from "../../types"
import { useUserStore } from "../../../user/state/store"
import { selector as userSelector } from "../../../user/state"

// third party
import { useParams } from "react-router-dom"
import { useShallow } from "zustand/shallow"
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

// static data 
import actions from "../../../assets/data/actions.json"
import Dropdown from "../../../components/dropdown"

type NodeActionsProps = JSX.IntrinsicElements["div"] & {
    id: string
    type: nodeTypes
    mode?: nodeModeTypes
    status?: nodeStatusType
}

export default function NodeActions({id, type, status, mode, className = "", ...props}: NodeActionsProps) {
    const { run, download, caption, getHref } = useNodeActions()
    
    const { perms, updateNode } = useMoodboardStore(useShallow(selector))
    const { id: uid, isAuthenticated } = useUserStore(useShallow(userSelector))

    const modes: {name: string, key: nodeModeTypes}[] = [
        {name: "generate", key: "generate"},
        {name: "replace", key: "replace"},
        {name: "recolor", key: "recolor"},
        {name: "structure", key: "structure"},
        {name: "style", key: "style"},
        {name: "remove back", key: "removeBackground"},
    ]

    return (
        <div className={`node-actions flex align-center justify-between ${className}`}>
            <div>
                {Object.entries(actions).map(([action, {icon, tooltip, disabled: off, onStatus, onNodeTypes, authOnly, tag}], i) => {
                    const margin = "0 5px 0"
                    const isEditor = perms?.isOwner || perms?.isEditor
                    const disabled = off || ((!isAuthenticated || !isEditor) && authOnly) 
                    
                    let onClick = undefined
                    switch (action) {
                        case "run":
                            onClick = () => run(id, uid)
                            break 
                        case "download":
                            onClick = () => download(id)
                            break
                        case "caption":
                            onClick = () => caption(id)
                            break
                        case "re-run":
                            onClick = () => {
                                updateNode(id, {reRun: true})
                                run(id, uid, true)
                            }
                            break
                        default:
                            break
                    }
     
                    return (status && onStatus.includes(status) && onNodeTypes.includes(type)) ?
                        tag === "a" ?
                            <NodeActionLink 
                                tooltip={tooltip}
                                href={getHref(id)}
                                icon={icon as IconProp}
                                key={`node-${id}-${action}-btn`}
                                style={{padding: 0, margin: margin}}
                            /> :
                        tag === "button" ?
                            <NodeActionButton 
                                tooltip={tooltip}
                                onClick={onClick}
                                disabled={disabled}
                                icon={icon as IconProp}
                                key={`node-${id}-${action}-btn`}
                                style={{padding: 0, margin: margin}}
                                className={`icon-button ${disabled ? "disabled" : ""}`} 
                            />
                        : null : null   
                })}
            </div>

            {type === "generatedImg" ?
                <Dropdown defaultValue={mode || "generate"}>
                    {modes.map(({name, key}) => {
                        return (
                            <span key={key} onClick={() => updateNode(id, {mode: key}, true)}>{name}</span>
                        )
                    })}
                </Dropdown>
                :
                <NodeActionButton 
                    disabled 
                    tooltip="coming soon!" 
                    className={`icon-button disabled"`} 
                    style={{padding: 0, margin: "0 5px 0 0"}}
                    icon={"fa-solid fa-ellipsis-vertical" as IconProp} 
                />
            }
        </div>
    )
}

type NodeActionButtonProps = JSX.IntrinsicElements["button"] & {
    icon: IconProp
    tooltip?: string
}


function NodeActionButton({icon, tooltip, onClick, className = "", ...props}: NodeActionButtonProps) {
    return (
        <button
            {...props}

            className={`icon-button ${className}`} 
            onClick={event => {
                event.stopPropagation()
                onClick && onClick(event)
            }}
        >
            <FontAwesomeIcon icon={icon} />
            <span className="tooltip-bottom">{tooltip}</span>
        </button>
    )
}

type NodeActionLinkProps = JSX.IntrinsicElements["a"] & {
    icon: IconProp
    tooltip?: string
}

function NodeActionLink({icon, tooltip, style, ...props}: NodeActionLinkProps) {
    return (
        <a 
            {...props}

            target="_blank"
            className="icon-button pointer" 
            style={{
                ...style,
                textDecoration: "none"
            }}
        >
            <FontAwesomeIcon icon={icon} />
            <span className="tooltip-bottom">{tooltip}</span>
        </a>
    )
}