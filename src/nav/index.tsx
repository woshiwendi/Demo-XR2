// custom imports
import { Nav, NavItem } from "./utils";
import { navStateType } from "./types";
import { UserState } from "../user/state";
import { SigninModal } from "../user/signin";

// third party
import { useState } from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// css sheets
import '../assets/css/nav.css'
import '../assets/css/vars/_nav.css';

type DefaultNavProps = JSX.IntrinsicElements["nav"] & {
    user: UserState
    data?: navStateType[]
}

export default function DefaultNav({user, data = [], ...props}: DefaultNavProps) {
    const { id, name, email, signout, isAuthenticated } = user
    const [openLogin, setOpenLogin] = useState<boolean>(!isAuthenticated)

    return (
        <>
        <Nav {...props}>
            <header>
                <a 
                    href={`/${id}`} 
                    className="flex align-center no-underline" 
                    onClick={event => {
                        if (window.location.pathname === `/${id}`) {
                            event.preventDefault()
                            event.stopPropagation()
                        } 
                    }}
                >
                    <FontAwesomeIcon 
                        style={{height: 20}}
                        className="color-primary-on-hover"
                        icon={"fa-solid fa-home-user" as IconProp} 
                    />
                    <h3>{name}</h3>
                </a>
                {data.length == 0 && props.children}
            </header>
            {data.length > 0 && 
                <section id="nav-content">
                    {data.map(({id, icon, ...nav}) => 
                        <NavItem 
                            key={id}
                            icon={icon}
                            state={{id: id, ...nav}}
                            style={{width: 150, padding: "10px 20px"}}
                        >
                            {nav.title}
                        </NavItem>
                    )}
                    {props.children}
                </section>
            }

            <span className="flex justify-center width-100">
                <button onClick={() => { isAuthenticated ? signout() : setOpenLogin(true) }} className="sign-button">
                    {isAuthenticated ? "Signout" : "Signin"}
                </button>
            </span>

            {process.env.REACT_APP_PROMO === "True" &&
                <section id="nav-promo" className="flex align-center justify-center">
                    <div className="promo-container">
                        <FontAwesomeIcon icon={"fa-solid fa-circle-up" as IconProp}/>
                        <p>Ready to go beyond this free plan? Upgrade for premium features.</p>
                        <button>View plans</button>
                    </div>
                </section>
            }
            <footer id="nav-footer"></footer>
        </Nav>
        {!isAuthenticated && <SigninModal open={openLogin} onOpen={setOpenLogin}/>}
        </>
    )
}