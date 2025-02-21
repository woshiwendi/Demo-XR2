// custom imports
import BaseNode from "../base"
import { selector } from "../../state"
import { nodeDataType } from "../../types"
import { Img } from "../../../components/img"
import { useMoodboardStore } from "../../state/store"

// third party
import { useShallow } from "zustand/shallow"
import { resizeImage } from "../../../utils"
import { uploadImg } from "../../api"

type UploadNodeProps = JSX.IntrinsicElements["div"] & {
    id: string
    data: nodeDataType
}

export const UploadNodeConstructor = (type: "img" | "sketch", sources: string[]) => function UploadNode({id, data: {img, title}, ...props}: UploadNodeProps) {
    const {id: mid, updateNodeData} = useMoodboardStore(useShallow(selector))

    return (
        <BaseNode 
            {...props}

            id={id}
            type={type}
            title={title}
            sources={sources}
        >
            <Img 
                src={img} 
                onUpload={file => {
                    if (file instanceof File) {
                        if (file.size > 1024 * 1024) {
                            resizeImage(file, async (resizedImgBlob) => {
                                const url = await uploadImg(mid, id, new File([resizedImgBlob], file.name))
                                if (url) updateNodeData(id, {title, img: url})
                            })
                        } else {
                            updateNodeData(id, {title, img: file})
                        }
                    } 
                }}
            />
        </BaseNode>
    )
}
