// third party imports 
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

// css stylesheets 
import "../assets/css/wrappers.css"

type ActionButtonWrapperProps = JSX.IntrinsicElements["button"] & {
    icon: IconProp
    // TODO: add tooltip?: string
}

export function ActionButtonWrapper({children, icon, className = "", style, ...props}: ActionButtonWrapperProps) {
    return (
        <span className="flex justify-between action-button-wrapper">
            {children}
            <button 
                style={{background: "none", ...style}}
                className={`icon-button action-button ${className}`} 
                {...props}
            >
                <FontAwesomeIcon icon={icon} />
            </button>
        </span>
    )
}