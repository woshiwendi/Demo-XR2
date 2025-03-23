// custom imports
import { meshType } from '../types';
import { MeshButton } from './buttons';

// third party
import { useState } from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type MeshLayersProps = JSX.IntrinsicElements['div'] & {
    mesh: meshType
    btnStyle?: React.CSSProperties
    svgStyle?: React.CSSProperties
}

export function MeshLayers({mesh: {id, segments, ...mesh}, style, btnStyle, svgStyle, ...props}: MeshLayersProps) {
    const [collapsed, setCollapsed] = useState(false)

    const hasSegments = segments.length > 0

    return (
        <div 
            className="mesh-layer" 
            style={{...style}} 
            {...props}
        >
            <div className='flex align-center'>
                {hasSegments && 
                    <FontAwesomeIcon 
                        style={{...svgStyle}}
                        className="dropdown-caret pointer"
                        onClick={() => setCollapsed(!collapsed)}
                        icon={`fa-solid fa-caret-${collapsed ? "down" : "right"}` as IconProp} 
                    />
                }
                <MeshButton id={id} style={{...btnStyle}} onClick={event => setCollapsed(!collapsed)} />
            </div>
            {hasSegments && collapsed && segments.map((segment, i) => {
                return (
                    <MeshLayers 
                        mesh={segment} 
                        style={{marginLeft: 15}}
                        key={`${segment.id}-layers`} 
                        svgStyle={{marginLeft: -15}}
                        // btnStyle={{width: "calc(100%)"}}
                    />
                )
            })}
        </div>
    )
}

