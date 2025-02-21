// custom imports
import BaseNode from "../base"
import { nodeDataType } from "../../types"
import { Img } from "../../../components/img"

// third party

type GeneratedImgNodeProps = JSX.IntrinsicElements["div"] & {
    id: string
    data: nodeDataType
}

export function GeneratedImgNode({id, data: {img, title}, ...props}: GeneratedImgNodeProps) {    
    return (
        <BaseNode 
            {...props}

            id={id}
            title={title}
            sources={["img"]}
            type="generatedImg"
            className="generatedImg out"
            targets={["style", "geometry"]}
            style={{minHeight: 120, width: 175}}
        >
            
            <Img src={img} disabled placeholder="Generated image will appear here" style={{textAlign: "center"}}/>
        </BaseNode>
    )
}