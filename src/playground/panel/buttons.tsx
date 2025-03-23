// custom imports
import { meshType } from '../types';
import { selector } from '../state';
import { downloadMesh } from '../utils';
import { usePlaygroundStore } from '../state/store';

// third party
import { useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type MeshButtonProps = JSX.IntrinsicElements['button'] & {
    id: meshType
}
export function MeshButton({id, onClick, className = "",...props}: MeshButtonProps) {
    const { meshes, selected, select, unselect, updateMesh, getMesh } = usePlaygroundStore(useShallow(selector))
    const { gif, title, ...mesh } = useMemo(() => getMesh(id), [meshes])

    return (
        <div className='flex justify-between width-100 align-center'>
            <button 
                {...props}
                onClick={event => { 
                    event.stopPropagation()
                    
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
                className={`mesh-layer-btn flex align-center ${className} ${selected.includes(id) ? "mesh-layer-selected" : ""}`}
            >
                {gif && <img src={gif} height={20} />}

                <h4
                    className="mesh-title overflow-ellipsis align-text-start"
                    style={{margin: 0, fontWeight: 400, marginLeft: gif ? 15 : 5}}
                >{title}</h4>
            </button>
            <button 
                className="icon-button" 
                onClick={event => {
                    event.stopPropagation()
                    downloadMesh({...mesh, gif, title} as meshType)
                }}
            >
                <FontAwesomeIcon icon={"fa-solid fa-download" as IconProp} style={{height: "var(--font-size-body-small)"}}/>
                <span className="tooltip">download</span>
            </button>
        </div>
    )
}   

type UploadMeshButtonProps = JSX.IntrinsicElements['button'] & {
    disabled?: boolean
    onUpload: (file: File) => void
}

export function UploadMeshButton({onUpload, disabled, ...props}: UploadMeshButtonProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files![0]
        if (!file) return

        onUpload && onUpload(file)
    }

    return (
        <>
            <button 
                {...props}
                className="icon-button" 
                onClick={event => !disabled && inputRef.current?.click()}
            >
                <FontAwesomeIcon icon={"fa-solid fa-upload" as IconProp} style={{height: "var(--font-size-body-small)"}}/>
                <span className="tooltip">upload mesh</span>
            </button>

            {!disabled && <input type="file" accept=".glb" onChange={onChange} hidden ref={inputRef}/>}
        </>
    )
}