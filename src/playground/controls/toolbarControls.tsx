// custom imports
import { selector } from "../state";
import { usePlaygroundStore } from "../state/store";

// third party
import { useShallow } from "zustand/shallow";

// static data
import playgroundData from "../../assets/data/playground.json";

type PlaygroundToolbarControlsProps = JSX.IntrinsicElements["div"] & {
}

export function PlaygroundToolbarControls({...props}: PlaygroundToolbarControlsProps) {
    const { tool: selectedTool } = usePlaygroundStore(useShallow(selector))

    switch (selectedTool.type) {
        case "faceSelector":
            return <FaceSelectorControls/>
        default:
            return <></>
    }
}

function FaceSelectorControls() {
    const { setTool } = usePlaygroundStore(useShallow(selector))

    return (
        <div className="playground-toolbar-controls">
            <input 
                min={16} 
                max={64} 
                type="range"
                defaultValue={16}
                onChange={event => {
                    setTool({type: "faceSelector", settings: {size: event.target.value}} as any)
                }} 
            />
        </div>
    )
}