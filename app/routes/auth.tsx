import { useMemo } from "react";
import { useLocation } from "react-router";
import { usePuterStore } from "~/hooks/usePuterStore";

export const meta = () => ([
    { title: "Resumind | Account" },
    { name: "description", content: "Manage your account" }
]);

const Auth = () => {
    const { isLoading, user, login, logout } = usePuterStore();
    const location = useLocation();

    const redirectTo = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const value = params.get("redirectTo");
        return value && value.startsWith("/") ? value : "/upload";
    }, [location.search]);

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px] rounded-2xl shadow-lg">
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-8 max-w-sm w-full min-w-[320px]">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {user ? `Hi, ${user.username}!` : "Welcome"}
                        </h1>
                        <p className="text-gray-500">
                            {user ? "You are currently logged in." : "Log in to continue your job journey"}
                        </p>
                    </div>

                    <div>
                        {isLoading ? (
                            <button className="w-full bg-gray-200 py-3 rounded-lg animate-pulse" disabled>
                                <p className="text-gray-500 italic">Checking status...</p>
                            </button>
                        ) : user ? (
                            <button
                                onClick={logout}
                                className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-all font-semibold shadow-md active:scale-95"
                            >
                                Log Out
                            </button>
                        ) : (
                            <button
                                onClick={() => login(redirectTo)}
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
};

export default Auth;
