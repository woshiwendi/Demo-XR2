import { ReactElement, ReactNode } from "react";

import ReactDOMServer from 'react-dom/server';

export function useCursor() {
    const set = (src: string | ReactElement) => {
        if (typeof src === "string") {
            document.body.style.cursor = src
        }
        else if (typeof src.type === "string" && src.type === "svg") {
            const width = parseInt((src.props.width || 0) as string)
            const height = parseInt((src.props.height || 0) as string)

            const uri = `data:image/svg+xml;base64,${btoa(ReactDOMServer.renderToString(src))}`
 
            document.body.style.cursor = `url("${uri}") ${width / 2} ${height / 2}, auto`
        }
    }

    return { set }
}
