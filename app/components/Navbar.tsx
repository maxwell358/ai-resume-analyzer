import { Link, NavLink } from "react-router";
import { usePuterStore } from "~/hooks/usePuterStore";

const Navbar = () => {
    const { user, logout, isLoading } = usePuterStore();

    return (
        <nav className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b sticky top-0 z-50">
            <Link to="/" className="text-lg md:text-2xl truncate max-w-[120px] md:max-w-none
 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Resumind
            </Link>

            <div className="flex items-center gap-3 md:gap-6">
                {/* 1. Link to the Upload page we just created */}
                <NavLink
                    to="/upload"
                    className={({ isActive }) =>
                        `font-medium transition-colors ${isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-500"}`
                    }
                >
                    Upload Resume
                </NavLink>

                <div className="h-6 w-[1px] bg-gray-200" />

                {/* 2. Puter Auth Logic */}
                {isLoading ? (
                    <div className="w-20 h-8 bg-gray-100 animate-pulse rounded-lg" />
                ) : user ? (
                    <div className="flex items-center gap-4">
                        <span className="hidden sm:block text-sm
 font-medium text-gray-700">
                            Hi, <span className="text-blue-600">{user.username}</span>
                        </span>
                        <button
                            onClick={logout}
                            className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors"
                        >
                            Log Out
                        </button>
                    </div>
                ) : (
                    <Link
                        to="/auth"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md"
                    >
                        Sign In
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
