// custom imports
import { useCustomState } from "../utils";
import { useUserStore } from "./state/store";
import { selector as userSelector } from "./state";
import { Modal, ModalProps } from "../components/modal";
import { ActionButtonWrapper } from "../components/wrappers";

// third party
import { useState } from "react";
import { useShallow } from "zustand/shallow";

// images 
import {ReactComponent as SponjLogo3} from "../assets/logo/sponj_v3.svg"


type SinginModalProps = ModalProps & {
}

export function SigninModal({open, className = "", ...props}: SinginModalProps) {
    const [{email, password}, set] = useCustomState<{email: string, password: string}>({email: "", password: ""})

    const { signin } = useUserStore(useShallow(userSelector))
    const [showPassword, setShowPassword] = useState<boolean>(false)
    return (
        <Modal open={typeof open === "boolean" ? open : true} {...props} className={`flex column align-center login-modal ${className}`}>
            <SponjLogo3 style={{width: 150, margin: 0, fill: 'var(--font-color-primary)'}}/>
            <h3 className="bold">Sign in to start creating!</h3>
            
            <form className="flex column" style={{width: "80%"}}>
                <input 
                    type="email"
                    value={email}
                    placeholder="Email" 
                    className="form-field" 
                    autoComplete="username"
                    onChange={event => set({email: event.target.value})}
                />
                <ActionButtonWrapper 
                    style={{right: "calc(20% - 5px)"}}
                    onClick={event => {
                        event.preventDefault()
                        event.stopPropagation()
                        setShowPassword(!showPassword)
                    }}
                    icon={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}` as any} 
                >
                    <input 
                        value={password}
                        placeholder="Password" 
                        autoComplete="current-password"
                        type={showPassword ? "text" : "password"}
                        className="form-field __password width-100" 
                        onChange={event => set({password: event.target.value})}
                    />
                </ActionButtonWrapper>
            </form>

            <span className="flex align-center">
                <button onClick={event => signin(email, password)}>Sign in</button>
                <a href="https://sponj3d.online" className="button __outlined" style={{textDecoration: "none"}}>Homepage</a>
            </span>
        </Modal>
    )
}