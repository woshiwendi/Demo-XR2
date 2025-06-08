// custom imports

// third party

type MeshMessageProps = JSX.IntrinsicElements['p'] & {
    text: string
    gif?: string
    system?: boolean
}

export function MeshMessage({text, gif, system, ...props}: MeshMessageProps) {
    const sender = system ? "system" : "user"

    return (
        <>
            {gif && <img 
                src={gif} 
                className={`message-${sender}`} 
                style={{padding: 0, width: 100, margin: 0}} 
            />}
            <p {...props} className={`message-${sender}`}>{text}</p>
        </>
    )
}