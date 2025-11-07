import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setAuthed(!!user);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) {
        return null; // or a small spinner
    }

    if (!authed) {
        // Also fall back to localStorage in case auth state hasn't hydrated yet
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        if (!token || !user) {
            return <Navigate to="/login" replace state={{ from: location.pathname }} />;
        }
    }

    return children;
}
