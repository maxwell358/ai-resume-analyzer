import { useState, useEffect } from "react";

export function usePuterStore() {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkStatus = async () => {
            // Check if window.puter exists from your <script> tag
            if (typeof window !== "undefined" && window.puter) {
                const signedIn = await window.puter.auth.isSignedIn();
                if (signedIn) {
                    const data = await window.puter.auth.getUser();
                    setUser(data);
                }
            }
            setIsLoading(false);
        };
        checkStatus().catch(() => setIsLoading(false));
    }, []);

    const login = async () => {
        if (!window.puter) return;
        setIsLoading(true);
        await window.puter.auth.signIn();
        window.location.href = "/";
    };

    const logout = async () => {
        if (!window.puter) return;
        await window.puter.auth.signOut();
        window.location.reload();
    };

    return { isLoading, user, login, logout };
}
