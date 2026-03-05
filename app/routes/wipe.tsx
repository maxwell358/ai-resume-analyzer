import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { clearHomeFeed, setHomeFeedWiped } from "~/lib/homeFeed";
import { usePuterStore } from "~/hooks/usePuterStore";

export const meta = () => ([
    { title: "Resumind | Wipe Data" },
    { name: "description", content: "Delete cloud resume records and clear Home feed." },
]);

const RESUME_KEY_PREFIX = "resume:";

type WipeSummary = {
    scannedKeys: number;
    deletedKeys: number;
    skippedPaths: number;
    deletedFiles: number;
    keyDeleteFailures: number;
    fileDeleteFailures: number;
};

const extractResumePaths = (value: unknown): string[] => {
    let payload: unknown = value;
    if (typeof value === "string") {
        try {
            payload = JSON.parse(value);
        } catch {
            return [];
        }
    }

    if (!payload || typeof payload !== "object") return [];
    const data = payload as Record<string, unknown>;
    const paths = [data.resumePath, data.imagePath]
        .filter((path): path is string => typeof path === "string" && path.length > 0)
        .filter((path) => !path.startsWith("http://") && !path.startsWith("https://"));

    return paths;
};

const Wipe = () => {
    const { auth, fs, kv, isLoading: storeLoading } = usePuterStore();
    const navigate = useNavigate();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isWiping, setIsWiping] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<WipeSummary | null>(null);

    useEffect(() => {
        const verifyAccess = async () => {
            if (storeLoading) return;
            if (!auth) {
                setError("Puter auth service is unavailable. Refresh and try again.");
                setIsCheckingAuth(false);
                return;
            }

            const signedIn = await auth.isSignedIn();
            if (!signedIn) {
                navigate("/auth?redirectTo=/wipe");
                return;
            }
            setIsCheckingAuth(false);
        };

        verifyAccess().catch((err) => {
            console.error("Failed to verify auth for wipe:", err);
            setError("Unable to verify your session.");
            setIsCheckingAuth(false);
        });
    }, [auth, navigate, storeLoading]);

    const canWipe = useMemo(() => Boolean(fs && kv && !isWiping), [fs, kv, isWiping]);

    const listResumePairs = async () => {
        if (!kv) return [] as PuterKVPair<unknown>[];

        const allPairs: PuterKVPair<unknown>[] = [];
        let cursor: string | undefined;

        for (let page = 0; page < 25; page++) {
            const response = await kv.list<unknown>({
                pattern: `${RESUME_KEY_PREFIX}*`,
                returnValues: true,
                limit: 100,
                ...(cursor ? { cursor } : {}),
            });

            if (Array.isArray(response)) {
                allPairs.push(...response);
                break;
            }

            allPairs.push(...response.items);
            if (!response.cursor) break;
            cursor = response.cursor;
        }

        return allPairs;
    };

    const handleWipe = async () => {
        if (!fs || !kv) {
            setError("Puter storage services are unavailable. Refresh and try again.");
            return;
        }

        setIsWiping(true);
        setError(null);
        setSummary(null);

        let scannedKeys = 0;
        let deletedKeys = 0;
        let skippedPaths = 0;
        let deletedFiles = 0;
        let keyDeleteFailures = 0;
        let fileDeleteFailures = 0;

        const filePathsToDelete = new Set<string>();

        try {
            const pairs = await listResumePairs();
            scannedKeys = pairs.length;

            for (const pair of pairs) {
                const paths = extractResumePaths(pair.value);
                if (paths.length === 0) {
                    skippedPaths += 1;
                } else {
                    for (const path of paths) filePathsToDelete.add(path);
                }
            }

            for (const path of filePathsToDelete) {
                try {
                    await fs.delete(path);
                    deletedFiles += 1;
                } catch (err) {
                    console.warn(`Failed to delete file path: ${path}`, err);
                    fileDeleteFailures += 1;
                }
            }

            for (const pair of pairs) {
                try {
                    await kv.del(pair.key);
                    deletedKeys += 1;
                } catch (err) {
                    console.warn(`Failed to delete key: ${pair.key}`, err);
                    keyDeleteFailures += 1;
                }
            }

            clearHomeFeed();
            setHomeFeedWiped(true);
            setSummary({
                scannedKeys,
                deletedKeys,
                skippedPaths,
                deletedFiles,
                keyDeleteFailures,
                fileDeleteFailures,
            });
        } catch (err) {
            console.error("Cloud wipe failed:", err);
            setError("Cloud wipe failed before completion. Please try again.");
        } finally {
            setIsWiping(false);
        }
    };

    const handleHomeOnlyReset = () => {
        clearHomeFeed();
        setHomeFeedWiped(true);
        setSummary(null);
    };

    if (isCheckingAuth || storeLoading) {
        return (
            <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
                <section className="main-section p-8">
                    <div className="max-w-2xl w-full bg-white border border-gray-100 rounded-2xl p-8 shadow-xl">
                        <h1 className="!text-4xl text-black font-bold">Wipe Data</h1>
                        <p className="text-gray-600 mt-3">Checking your account access...</p>
                    </div>
                </section>
            </main>
        );
    };

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
            <section className="main-section p-8">
                <div className="max-w-2xl w-full bg-white border border-gray-100 rounded-2xl p-8 shadow-xl">
                    <h1 className="!text-4xl text-black font-bold">Wipe Resume Data</h1>
                    <p className="text-gray-600 mt-3">
                        This removes cloud resume records (`resume:*` keys) and attempts to delete linked uploaded files.
                    </p>
                    <p className="text-gray-500 mt-2 text-sm">
                        It also clears your Home feed so your dashboard waits for fresh uploads.
                    </p>

                    {error && (
                        <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>
                    )}

                    {summary && (
                        <div className="mt-4 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-1">
                            <p>Scanned keys: {summary.scannedKeys}</p>
                            <p>Deleted keys: {summary.deletedKeys}</p>
                            <p>Deleted files: {summary.deletedFiles}</p>
                            <p>Key delete failures: {summary.keyDeleteFailures}</p>
                            <p>File delete failures: {summary.fileDeleteFailures}</p>
                            <p>Entries without file paths: {summary.skippedPaths}</p>
                        </div>
                    )}

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <button
                            type="button"
                            onClick={handleWipe}
                            disabled={!canWipe}
                            className="bg-red-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isWiping ? "Wiping Cloud Data..." : "Wipe Cloud + Home Data"}
                        </button>
                        <button
                            type="button"
                            onClick={handleHomeOnlyReset}
                            disabled={isWiping}
                            className="px-5 py-3 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            Home Only Reset
                        </button>
                        <Link
                            to="/"
                            className="px-5 py-3 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-center"
                        >
                            Back Home
                        </Link>
                        <Link
                            to="/upload"
                            className="px-5 py-3 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-center"
                        >
                            Upload New Resume
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Wipe;
