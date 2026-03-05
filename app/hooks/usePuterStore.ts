import { useState, useEffect } from "react";

interface PuterStore {
    isLoading: boolean;
    user: PuterUser | null;
    login: (redirectTo?: string) => Promise<void>;
    logout: () => Promise<void>;
    fs: PuterFS | null;
    ai: PuterAI | null;
    kv: PuterKV | null;
    auth: PuterAuth | null;
}

export function usePuterStore(): PuterStore {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<PuterUser | null>(null);

    const puter = typeof window !== "undefined" ? window.puter ?? null : null;

    useEffect(() => {
        const checkStatus = async () => {
            if (typeof window === "undefined") {
                setIsLoading(false);
                return;
            }

            const maxAttempts = 30;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const sdk = window.puter;
                if (sdk?.auth) {
                    const signedIn = await sdk.auth.isSignedIn();
                    if (signedIn) {
                        const data = await sdk.auth.getUser();
                        setUser(data);
                    }
                    setIsLoading(false);
                    return;
                }

                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            setIsLoading(false);
        };

        checkStatus().catch(() => setIsLoading(false));
    }, []);

    const login = async (redirectTo: string = "/") => {
        const sdk = typeof window !== "undefined" ? window.puter ?? null : null;
        if (!sdk?.auth) return;
        setIsLoading(true);
        await sdk.auth.signIn();
        window.location.href = redirectTo;
    };

    const logout = async () => {
        const sdk = typeof window !== "undefined" ? window.puter ?? null : null;
        if (!sdk?.auth) return;
        await sdk.auth.signOut();
        window.location.reload();
    };

    return {
        isLoading,
        user,
        login,
        logout,
        fs: puter?.fs ?? null,
        ai: puter?.ai ?? null,
        kv: puter?.kv ?? null,
        auth: puter?.auth ?? null,
    };
}
