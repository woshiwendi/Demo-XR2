// custom imports
import { useCustomState } from "../utils";
import { useUserStore } from "./state/store";
import { selector as userSelector } from "./state";
import { Modal, ModalProps } from "../components/modal";

// third party
import { useShallow } from "zustand/shallow";

// images 
import {ReactComponent as SponjLogo3} from "../assets/logo/sponj_v3.svg"


type SinginModalProps = ModalProps & {
}

export function SigninModal({open, className = "", ...props}: SinginModalProps) {
    const [{email, password}, set] = useCustomState<{email: string, password: string}>({email: "", password: ""})

    const { signin } = useUserStore(useShallow(userSelector))

    return (
        <Modal open={typeof open === "boolean" ? open : true} {...props} className={`flex column align-center login-modal ${className}`}>
            <SponjLogo3 style={{width: 150, margin: 0, fill: 'var(--font-color-primary)'}}/>
            <h3 className="bold">Sign in to start creating!</h3>
            
            <span className="flex column" style={{width: "80%"}}>
                <input 
                    type="email"
                    value={email}
                    placeholder="Email" 
                    className="form-field" 
                    onChange={event => set({email: event.target.value})}
                />
                <input 
                    type="password"
                    value={password}
                    placeholder="Password" 
                    className="form-field __password" 
                    onChange={event => set({password: event.target.value})}
                />
            </span>

            <span className="flex align-center">
                <button onClick={event => signin(email, password)}>Sign in</button>
                <a href="https://sponj3d.online" className="button __outlined" style={{textDecoration: "none"}}>Homepage</a>
            </span>
        </Modal>
    )
}