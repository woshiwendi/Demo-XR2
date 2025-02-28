// custom imports
import NodeHandle from "./handle";
import NodeHeader from "./header";
import NodeActions from "./actions";
import { find } from "../../../utils";
import { selector } from "../../state";
import { nodeType, nodeTypes } from "../../types";
import { useMoodboardStore } from "../../state/store";
import { useUserStore } from "../../../user/state/store";
import { selector as userSelector } from "../../../user/state";

// third party
import { useMemo } from "react";
import { Position } from "@xyflow/react";
import { useShallow } from "zustand/shallow";

type BaseNodeProps = JSX.IntrinsicElements["div"] & {
    id: string
    title: string
    type: nodeTypes

    sources?: string[]
    targets?: string[]

    onRun?: () => void
}
export default function BaseNode({id, type, title, targets = [], sources = [], children, className, style, onClick, ...props}: BaseNodeProps) {
    const {
        nodes, 
        
        perms,
        owner: mbOwner, 

        selected, 
        
        select, 
        unselect,
    } = useMoodboardStore(useShallow(selector));
    const { id: uid } = useUserStore(useShallow(userSelector))
    const active = selected.includes(id)
    
    const node = useMemo(() => find<nodeType>(nodes, {id}, ['id']), [nodes])
    const owner = useMemo(() => node?.owner, [node])
    
    const status = useMemo(() => node?.status, [nodes])
    const isPending = status === "pending"

    return (
        <div 
            className="node"
            onClick={event => { 
                if (event.shiftKey) {
                    if (selected.includes(id)) {
                        unselect(id)
                    } else {
                        select(id)
                    }
                } else {
                    unselect()
                    select(id)
                }
                
                onClick && onClick(event)
            }}
        >
            {!["comment"].includes(type) && 
                <NodeHeader 
                    id={id} 
                    value={title} 
                    className="drag-handle__custom"
                    style={{backgroundColor: `var(--node-title-color-${type})`}}
                />
            }

            <div 
                style={{...style, 
                    backgroundColor: `
                        var(--node-color-${type}${owner?.id ? (
                            ["comment"].includes(type) ? (
                                owner.id == mbOwner.id ? "-owner" : perms?.isEditor ? "-editor" : "-viewer"
                            ) : ""
                        ) : "-anon"}, var(--node-color-default))
                    `
                    }}
                    
                className={`
                    node-body 
                    node-${type}
                    ${className}
                    justify-center 
                    flex align-center 
                    ${isPending? "loading-border" : ""} 
                    node-${type}-${active? "active" : ""}
                `} 
            >
                <NodeHandle 
                    nid={id} 
                    type="target"
                    nodeType={type}
                    handles={targets}
                    position={Position.Left}
                />

                {!isPending && children}
                {isPending && 
                    <div 
                        className="spinner" 
                        // onClick={() => setNodeStatus(id, "ready")}
                    ></div>
                }

                <NodeHandle 
                    nid={id} 
                    type="source"
                    nodeType={type}
                    handles={sources}
                    position={Position.Right}
                />
            </div>

            {!["comment"].includes(type) && !isPending && 
                <NodeActions 
                    id={id} 
                    type={type} 
                    status={status}
                    mode={node?.mode}
                    className={`drag-handle__custom ${active ? "active" : ""}`} 
                />
            }
        </div>
    )
}
