// custom imports
import { uploadMesh } from '../api';
import { selector } from '../state';
import { MeshLayers } from './layers';
import { Img } from '../../components/img';
import { UploadMeshButton } from './buttons';
import { usePlaygroundStore } from '../state/store';

// third party
import { useShallow } from 'zustand/shallow';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type PlaygroundPanelProps = JSX.IntrinsicElements['div'] & {
}

export function PlaygroundPanel({className = "", style, ...props}: PlaygroundPanelProps) {
    const { id: pid, meshes } = usePlaygroundStore(useShallow(selector))

    return (
        <div className={`playground-panel ${className}`} style={{...style}} {...props}>
            <div className='flex column justify-between'>
                <h3><b>Meshes</b></h3>
                {/*** TODO: activate mesh generation after ai api machine is setup ***/}
                {/* <UploadMeshButton 
                    onUpload={file => {
                        console.log(file)
                        uploadMesh(pid, file)
                    }}
                /> */}
            </div>
            <div className='mesh-layers-container'>
                {meshes.map(mesh => {
                    return mesh.isCurrent && <MeshLayers key={`${mesh.id}-layers`} mesh={mesh} />
                })}
            </div>
        </div>
    )
}

