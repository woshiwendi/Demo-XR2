// custom imports
import BaseNode from "../base"
import { Img } from "../../../components/img"

// third party
import { nodeDataType } from "../../types"
import { useNavigate, useParams } from "react-router-dom"

type MeshNodeProps = JSX.IntrinsicElements["div"] & {
    id: string
    data: nodeDataType
}

export default function MeshNode({id, data: {title, src, playground}, ...props}: MeshNodeProps) {
    const params = useParams()
    const navigate = useNavigate()

    const uid = params.uid

    return (
        <BaseNode 
            {...props}

            id={id}
            type="mesh"
            title={title}
            sources={["mesh"]}
            className="mesh out"
            targets={["style", "geometry"]}
            // style={{height: hasData? 175 : 120, width: 175}}
        >
            <Img 
                disabled 
                src={playground?.meshes[0].gif} 
                href={playground? `/${uid}/playground/${playground.id}` : undefined}
                placeholder="Generated mesh will appear here" style={{textAlign: "center"}}
            />
        </BaseNode>
    )
}