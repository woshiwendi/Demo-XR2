import { LinkProps } from "react-router-dom"

export type NavProps = JSX.IntrinsicElements["nav"] & {
}

export type NavItemProps = JSX.IntrinsicElements["nav"] & {
    icon?: string
    state: navStateType
    iconStyle?: React.CSSProperties
    hrefStyle?: React.CSSProperties
}

export type NavCrumbItemProps = LinkProps & {
    to: string
    state: navStateType
}

export type NavCrumbsProps = JSX.IntrinsicElements["header"] & {    
    defaultCrumbs?: navStateType[]
}

export type navStateType = {
    id: string
    href: string
    icon?: string
    title: string
    prevState?: navStateType
}