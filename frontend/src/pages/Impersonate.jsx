import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

const Impersonate = () => {
    const navigate = useNavigate();
    const { login, setUser } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        if (!token) return;
        try {
            login(token);
            const decoded = jwtDecode(token);
            setUser({
                id: decoded.id,
                email: decoded.email,
                impersonated: true,
            });
            navigate("/", { replace: true });
        } catch (err) {
            console.error("Invalid token", err);
        }
    }, []);

    return (
        <div style={{ padding: "50px", textAlign: "center" }}>
            <h2>Logging you in...</h2>
        </div>
    );
};

export default Impersonate;
