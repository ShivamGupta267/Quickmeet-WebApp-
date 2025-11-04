import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
    const authComponent = (props) => {
        const router = useNavigate();

        const isAuthenticated = () => {
            if(localStorage.getItem("token")){
                return true;
            }
            return false
        }

        useEffect(( ) => {
            if(!isAuthenticated()) {
                router("/register")
            }
        }, [])
        return <WrappedComponent {... props} />
    }
    return authComponent
}

export default withAuth;