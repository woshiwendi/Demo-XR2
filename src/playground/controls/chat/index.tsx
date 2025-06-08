// custom imports
import { selector } from '../../state';
import { MeshMessage } from './message';
import Txt from '../../../components/txt';
import { usePlaygroundStore } from '../../state/store';

// third party
import { editMesh } from '../../api';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionButtonWrapper } from '../../../components/wrappers';

type MeshChatProps = JSX.IntrinsicElements['div'] & {
    meshId: string
}

export function MeshChat({meshId, className, style, ...props}: MeshChatProps) {
    const { meshes, getChat, getMesh, unselect} = usePlaygroundStore(useShallow(selector))
    const [prompt, setPrompt] = useState<string>()

    const mesh = useMemo(() => getMesh(meshId), [meshId])
    const chat = useMemo(() => getChat(meshId), [meshes])

    const chatRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        setTimeout(() => {if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight}, 100)
    }, [chat])
    
    return (
        <>
        <div style={{height: "calc(100% - 2em - 16.8px - 50px)", ...style}} className={`overflow-scroll ${className}`} ref={chatRef}>
            <div {...props} className={`chat flex column justify-end ${className}`} style={{minHeight: "100%"}}>
                {chat.map(({meshId, message, sender}, i) => {
                    let gif;
                    try {
                        gif = sender === "system" ? getMesh(meshId).gif : undefined
                    } catch (error) {
                        // console.error(error)
                    }

                    return (
                        <MeshMessage 
                            text={message} 
                            key={`$(meshId}-chat-${i}`}
                            system={sender === "system"}
                            gif={gif}
                        />
                    )
                })}

            </div>
        </div>
        <ActionButtonWrapper
            style={{marginTop: 17}}
            disabled={mesh.status !== "ready"}
            icon={"fa-solid fa-paper-plane" as any} 
            onClick={event => {
                if (prompt) {
                    editMesh(meshId, prompt, []) 
                    unselect()
                    setPrompt(undefined)
                }
                // right now mesh.selected.faces is a list of [v1, v2, v3], we want a list of face indicies

                event.stopPropagation()
            }}
        >
            <Txt 
                text={prompt || ""} 
                onChange={event => {
                    event.preventDefault()
                    event.stopPropagation()
                    setPrompt(event.target.value)
                }}
                placeholder="Write your prompt here..."
                style={{
                    marginTop: 10, 
                    paddingRight: 35,
                    backgroundColor: "var(--bg-primary)",
                }}
            />
        </ActionButtonWrapper>
        </>
    )
}