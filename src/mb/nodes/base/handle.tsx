// custom imports
import { selector } from "../../state";
import { edgeType, nodeType, nodeTypes } from "../../types";
import { useMoodboardStore } from "../../state/store";

// third party
import { useShallow } from "zustand/shallow";
import { Handle, HandleProps } from "@xyflow/react";
import { generateUUID } from "three/src/math/MathUtils";
import { filter, find } from "../../../utils";

type NodeHandleProps = HandleProps & {
    nid: string
    handles: string[]
    nodeType: nodeTypes
}

export default function NodeHandle({nid, type, nodeType, position, handles, className, style, ...props}: NodeHandleProps) {
    const { nodes, edges } = useMoodboardStore(useShallow(selector)); 

    // edges of interest
    const eoi = filter<edgeType>(edges, {target: nid, source: nid}, [type], undefined, (eq) => eq) || []

    return (
        <>
            {handles?.map((handle, i) => {
                const id = generateUUID()
                const top = ((i + 1) * 100) / (handles.length + 1)
                let s = handle === "style" ? 7 : 9 // handle size
                
                let handleType = nodeType
                let shape = `node-handle-${handle}`
                
                // edge of interest
                const edge = find<edgeType>(eoi, {targetHandle: handle, sourceHandle: handle}, [`${type}Handle`])
                const source = find<nodeType>(nodes, {id: edge?.source}, ['id'])
                const target = find<nodeType>(nodes, {id: edge?.target}, ['id'])
                
                if (source && type === "target") {
                    handleType = source.type as nodeTypes
                } else if (type === "target" || (type === "source" && !target)) {
                    handleType = "default" as nodeTypes
                } 
                const bgColor = `var(--node-title-color-${handleType}, var(--node-color-default))`

                return (
                    <Handle
                        {...props}

                        key={id}
                        type={type}
                        id={handle}
                        position={position}
                        className={`node-handle ${shape} ${className}`}

                        style={{
                            width: s, 
                            height: s, 
                            top: `${top}%`, 
                            border: `1px solid ${bgColor}`,
                            backgroundColor: `var(--node-title-color-${handleType}, var(--font-color-primary))`,
                            ...style
                        }}
                    >
                        {type === "target" && <p>{handle}</p>}
                    </Handle>
                )
            })}
        </>
    )
}