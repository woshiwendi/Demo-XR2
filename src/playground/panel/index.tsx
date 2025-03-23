// custom imports
import { selector } from '../state';
import { MeshLayers } from './layers';
import { usePlaygroundStore } from '../state/store';

// third party
import { useShallow } from 'zustand/shallow';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { UploadMeshButton } from './buttons';
import { uploadMesh } from '../api';

type PlaygroundPanelProps = JSX.IntrinsicElements['div'] & {
}

export function PlaygroundPanel({...props}: PlaygroundPanelProps) {
    const { id: pid, meshes } = usePlaygroundStore(useShallow(selector))

    return (
        <div className="playground-panel">
            <div className='flex justify-between align-center'>
                <h3><b>Meshes</b></h3>
                {/* <UploadMeshButton 
                    onUpload={file => {
                        console.log(file)
                        uploadMesh(pid, file)
                    }}
                /> */}
            </div>
            <div className='mesh-layers-container'>
                {meshes.map(mesh => <MeshLayers key={`${mesh.id}-layers`} mesh={mesh} />)}
            </div>
        </div>
    )
}

