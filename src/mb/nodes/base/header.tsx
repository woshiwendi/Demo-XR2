// custom imports
import { selector } from "../../state";
import { useMoodboardStore } from "../../state/store";
import { EditableH3, EditableProps } from "../../../components/editable";

// third party
import { useShallow } from "zustand/shallow";

type NodeHeaderProps = EditableProps & {
    id: string
}

export default function NodeHeader({id, value, className = "", style, onTypingStopped,...props}: NodeHeaderProps) {
    const { updateNodeData } = useMoodboardStore(useShallow(selector));
    
    return (
        <EditableH3 
            {...props}
            value={value}
            className={`node-title ${className}`}
            style={{margin: "0 0 5px 0", fontWeight: 550, ...style}}

            onTypingStopped={header => {
                updateNodeData(id, {title: header})

                onTypingStopped && onTypingStopped(header)
            }}
        />
    )
}