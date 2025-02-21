// custom imports
import { NavCrumbItemProps, NavCrumbsProps, NavItemProps, NavProps, navStateType } from "./types"

// third party
import { Link, useLocation } from "react-router-dom"
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

export function Nav(props: NavProps) {
    return (
        <nav style={{...props.style}}><ul>{props.children}</ul></nav>
    )
}

export function NavItem({icon, iconStyle, state, hrefStyle, onClick, ...props}: NavItemProps) {
    // @ts-ignore
    const iconProp: IconProp = icon

    return (
        <li style={{...props.style}}>
            <FontAwesomeIcon icon={iconProp} style={{...iconStyle}}/>
            <Link style={{...hrefStyle}} state={state} to={state.href} onClick={onClick}>{props.children}</Link>
        </li>
    )
}

export function NavCrumbs({defaultCrumbs,...props}: NavCrumbsProps) {
    let state = useLocation().state as navStateType
    const crumbs: navStateType[] = defaultCrumbs || []

    if (!defaultCrumbs) {
        let tmpState = state?.prevState
        while (tmpState) {
            crumbs.push(tmpState)
            tmpState = tmpState.prevState
        }
    }

    return (
        <header {...props}>
            <div className="flex align-center crumb">
                {crumbs.reverse().map((crumb, i) => {
                    return (
                        <span key={i}>
                            {i > 0 && <span className="crumb-separator">{'>'}</span>}
                            <NavCrumbItem state={crumb} to={crumb.href}/>
                        </span>
                    )
                })}
            </div>
        </header>
    )
}

export function NavCrumbItem({state, to, ...props}: NavCrumbItemProps) {
    return (
        <Link to={to} {...props} state={state}>{state.title}</Link>
    )
}