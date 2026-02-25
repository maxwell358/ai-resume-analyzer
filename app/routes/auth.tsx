import React, { useState, useEffect } from "react";
import type { Route } from "./+types/auth";

declare global {
    interface Window {
        puter: any;
    }
}

export const meta = () => ([
    { title: 'Resumind | Account' },
    { name: 'description', content: 'Manage your account' }
])

export async function loader({ }: Route.LoaderArgs) {
    return {};
}

//  THE HOOK (The "Brain")
function usePuterStore() {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const signedIn = await window.puter.auth.isSignedIn();
                if (signedIn) {
                    const data = await window.puter.auth.getUser();
                    setUser(data);
                }
            } catch (err) {
                console.error("Auth Check Error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        checkStatus().catch(console.error);
    }, []);

    const login = async () => {
        setIsLoading(true);
        try {
            await window.puter.auth.signIn();
            //  ONLY redirect if the login was successful
            window.location.href = "/";
        } catch (err) {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await window.puter.auth.signOut();
            setUser(null);
            window.location.reload(); // Refresh to show login button again
        } catch (err) {
            setIsLoading(false);
        }
    };

    return { isLoading, user, login, logout };
}

//  AUTH COMPONENT (The "Face")
const Auth = () => {
    const { isLoading, user, login, logout } = usePuterStore();

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px] rounded-2xl shadow-lg">
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-8 max-w-sm w-full min-w-[320px]">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {user ? `Hi, ${user.username}!` : "Welcome"}
                        </h1>
                        <p className="text-gray-500">
                            {user ? "You are currently logged in." : "Log In to Continue Your Job Journey"}
                        </p>
                    </div>

                    <div>
                        {isLoading ? (
                            <button className="w-full bg-gray-200 py-3 rounded-lg animate-pulse" disabled>
                                <p className="text-gray-500 italic">Checking status...</p>
                            </button>
                        ) : user ? (
                            /* LOGOUT BUTTON - Shows only when logged in */
                            <button
                                onClick={logout}
                                className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-all font-semibold shadow-md active:scale-95"
                            >
                                Log Out
                            </button>
                        ) : (
                            /* LOGIN BUTTON - Shows only when logged out */
                            <button
                                onClick={login}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md active:scale-95"
                            >
                                Sign in with Puter
                            </button>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Auth;
