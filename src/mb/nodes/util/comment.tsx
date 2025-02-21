// custom imports
import BaseNode from "../base";
import { find } from "../../../utils";
import { selector } from "../../state";
import Txt from "../../../components/txt";
import { nodeDataType, nodeType } from "../../types";
import { useMoodboardStore } from "../../state/store";

// third party
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";

type TxtNodeProps = JSX.IntrinsicElements["div"] & {
    id: string
    data: nodeDataType
}

export default function CommentNode({id, data: {src, title}, ...props}: TxtNodeProps) {
    const { nodes, updateNodeData } = useMoodboardStore(useShallow(selector))
    const [ text, setText ] = useState(src);

    const owner = useMemo(() => find<nodeType>(nodes, {id}, ['id'])?.owner, [nodes, id])

    useEffect(() => { setText(src) }, [src])
    
    return (
        <BaseNode 
            {...props}

            id={id}
            title={title}
            type="comment"
            style={{width: 200}}
            className="flex column align-start"
        >
            <Txt 
                text={text || ""}
                defaultValue={src}
                onChange={event => {
                    event.preventDefault()
                    event.stopPropagation()
                    setText(event.target.value)
                }}
                style={{color: "var(--node-font-color-comment)"}}
                onTypingStopped={() => updateNodeData(id, {title, src: text})}
                placeholder="This is a comment..."
            />
            <p style={{margin: 10}}>{owner?.name || "Anonymous"}</p>
        </BaseNode>
    )
}