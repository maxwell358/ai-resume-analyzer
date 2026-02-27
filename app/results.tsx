import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { usePuterStore } from "~/hooks/usePuterStore";

type ResumeAnalysis = {
    id: string;
    resumePath: string;
    imagePath?: string;
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    feedback: string; // This is the JSON string from the AI
};

export default function Results() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { kv, auth, isLoading: storeLoading } = usePuterStore();
    const [data, setData] = useState<ResumeAnalysis | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getAnalysis = async () => {
            if (!id) {
                setError("Missing analysis ID.");
                setIsFetching(false);
                return;
            }

            if (!kv || !auth) return;

            const signedIn = await auth.isSignedIn();
            if (!signedIn) {
                navigate(`/auth?redirectTo=/results/${id}`);
                return;
            }

            try {
                const storageKey = `resume:${id}`;
                const result = await kv.get(storageKey);

                if (!result) {
                    setError("No results found for this analysis ID.");
                    return;
                }

                const parsed: ResumeAnalysis = JSON.parse(result);
                setData(parsed);
            } catch (err) {
                console.error("KV Fetch Error:", err);
                setError("Failed to load results.");
            } finally {
                setIsFetching(false);
            }
        };

        if (!storeLoading) {
            getAnalysis().catch((err) => {
                console.error("Results loading error:", err);
                setError("Failed to load results.");
                setIsFetching(false);
            });
        }
    }, [id, kv, auth, storeLoading, navigate]);

    // --- HELPER TO RENDER JSON FEEDBACK ---
    const renderFeedback = (feedbackString: string) => {
        try {
            const fb = JSON.parse(feedbackString);
            return (
                <div className="space-y-6">
                    {/* Score Section */}
                    <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
                        <div className="text-4xl font-black text-blue-600 bg-blue-50 w-20 h-20 flex items-center justify-center rounded-full border-4 border-blue-100">
                            {fb.score || fb.ats_score || "—"}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">Overall ATS Score</h3>
                            <p className="text-gray-500 text-sm italic">Based on {data?.jobTitle} requirements</p>
                        </div>
                    </div>

                    {/* Summary */}
                    {fb.summary && (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-2 underline decoration-blue-200">Executive Summary</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{fb.summary}</p>
                        </div>
                    )}

                    {/* Improvements List */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-blue-500">★</span> Recommended Improvements
                        </h3>
                        <ul className="space-y-3">
                            {(fb.improvements || fb.tips || fb.suggestions || []).map((tip: string, i: number) => (
                                <li key={i} className="flex gap-3 text-gray-600 text-sm border-b border-gray-50 pb-3 last:border-0">
                                    <span className="text-blue-400 font-bold">•</span> {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            );
        } catch (e) {
            // Fallback if the AI didn't return valid JSON
            return <div className="whitespace-pre-wrap text-gray-700 bg-white p-6 rounded-xl border">{feedbackString}</div>;
        }
    };

    if (storeLoading || isFetching) return <div className="p-20 text-center animate-pulse">Loading analysis...</div>;

    if (error || !data) {
        return (
            <main className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
                <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                    <p className="text-gray-600 mb-6">{error || "No results found."}</p>
                    <button onClick={() => navigate("/upload")} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Back to Upload</button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-12">
            <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
                <header className="bg-blue-600 p-8 text-white">
                    <h1 className="text-3xl font-black tracking-tight uppercase italic">Analysis Report</h1>
                    <p className="mt-2 font-medium opacity-80">{data.jobTitle} at {data.companyName}</p>
                </header>

                <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left: Resume Preview */}
                    <div className="lg:col-span-4 space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-blue-500 pl-3">Resume Preview</h2>
                        <div className="rounded-2xl overflow-hidden border-2 border-gray-100 shadow-lg">
                            {data.imagePath ? (
                                <img src={`https://puter.com${data.imagePath}`} className="w-full" alt="Resume Preview" />
                            ) : (
                                <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center italic text-gray-400">Preview not available</div>
                            )}
                        </div>
                        <a href={`https://puter.com${data.resumePath}`} target="_blank" rel="noreferrer"
                           className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all">
                            View PDF Resume
                        </a>
                    </div>

                    {/* Right: AI Feedback */}
                    <div className="lg:col-span-8 space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-blue-500 pl-3">AI Feedback & Scoring</h2>
                        <div className="bg-blue-50/50 p-2 md:p-6 rounded-3xl border border-blue-100">
                            {renderFeedback(data.feedback)}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
