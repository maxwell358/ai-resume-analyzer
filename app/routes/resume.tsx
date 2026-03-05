import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import { usePuterStore } from "~/hooks/usePuterStore";
import { resumes } from "../../constants";
import { asNumber, buildCloudUrl, normalizeTip, parseJsonObject, type FeedbackTip } from "~/lib/feedback";

export const meta = () =>([
    {title: 'Resumind | Review'},
    {name: 'description', content: 'Detailed overview of your resume'}
])

type ResumeAnalysis = {
    id: string;
    resumePath: string;
    imagePath?: string;
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    feedback: string;
};

const sampleById = new Map(
    resumes.map((sample) => [
        sample.id,
        {
            id: sample.id,
            resumePath: sample.resumePath,
            imagePath: sample.imagePath,
            companyName: sample.companyName ?? "Demo Company",
            jobTitle: sample.jobTitle ?? "Demo Role",
            jobDescription: "Demo resume analysis",
            feedback: JSON.stringify(sample.feedback),
        } satisfies ResumeAnalysis,
    ]),
);

const Resume = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { kv, auth, fs, isLoading: storeLoading } = usePuterStore();

    const [data, setData] = useState<ResumeAnalysis | null>(null);
    const [resumeFileUrl, setResumeFileUrl] = useState("");
    const [previewImageUrl, setPreviewImageUrl] = useState("");
    const [isPreparingLinks, setIsPreparingLinks] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getAnalysis = async () => {
            if (!id) {
                setError("Missing resume ID.");
                setIsFetching(false);
                return;
            }

            const sampleAnalysis = sampleById.get(id);
            if (sampleAnalysis) {
                setData(sampleAnalysis);
                setIsFetching(false);
                return;
            }

            if (!kv || !auth) {
                setError("Puter services are unavailable. Refresh and try again.");
                setIsFetching(false);
                return;
            }

            const signedIn = await auth.isSignedIn();
            if (!signedIn) {
                navigate(`/auth?redirectTo=/resume/${id}`);
                return;
            }

            try {
                const result = await kv.get(`resume:${id}`);
                if (!result) {
                    setError("No analysis found for this resume.");
                    return;
                }

                const parsed = JSON.parse(result) as ResumeAnalysis;
                setData(parsed);
            } catch (err) {
                console.error("Resume page load error:", err);
                setError("Failed to load resume analysis.");
            } finally {
                setIsFetching(false);
            }
        };

        if (!storeLoading) {
            getAnalysis().catch((err) => {
                console.error("Resume page load error:", err);
                setError("Failed to load resume analysis.");
                setIsFetching(false);
            });
        }
    }, [id, kv, auth, storeLoading, navigate]);

    useEffect(() => {
        const resolveReadUrl = async (path?: string) => {
            if (!path) return "";
            if (path.startsWith("http://") || path.startsWith("https://")) return path;
            if (!fs || typeof fs.getReadURL !== "function") return buildCloudUrl(path);

            try {
                return await fs.getReadURL(path);
            } catch (err) {
                console.warn("Failed to create Puter read URL:", err);
                return buildCloudUrl(path);
            }
        };

        if (!data) return;

        let cancelled = false;
        setIsPreparingLinks(true);
        setResumeFileUrl("");
        setPreviewImageUrl("");

        const prepareUrls = async () => {
            const [resolvedResumeUrl, resolvedImageUrl] = await Promise.all([
                resolveReadUrl(data.resumePath),
                resolveReadUrl(data.imagePath),
            ]);

            if (cancelled) return;
            setResumeFileUrl(resolvedResumeUrl);
            setPreviewImageUrl(resolvedImageUrl);
            setIsPreparingLinks(false);
        };

        prepareUrls().catch((err) => {
            console.error("Error preparing Puter read URLs:", err);
            if (!cancelled) setIsPreparingLinks(false);
        });

        return () => {
            cancelled = true;
        };
    }, [data, fs]);

    const parsedFeedback = useMemo(() => {
        if (!data?.feedback) return null;
        return parseJsonObject(data.feedback);
    }, [data?.feedback]);

    const overallScore = useMemo(() => {
        if (!parsedFeedback) return null;
        return (
            asNumber(parsedFeedback.overallScore) ??
            asNumber(parsedFeedback.score) ??
            asNumber(parsedFeedback.ats_score) ??
            asNumber(parsedFeedback.ATS?.score) ??
            0
        );
    }, [parsedFeedback]);

    const categories = useMemo(() => {
        if (!parsedFeedback) return [];

        const items = [
            { label: "ATS Compatibility", value: parsedFeedback.ATS },
            { label: "Tone & Style", value: parsedFeedback.toneAndStyle },
            { label: "Content", value: parsedFeedback.content },
            { label: "Structure", value: parsedFeedback.structure },
            { label: "Skills", value: parsedFeedback.skills },
        ];

        return items
            .map((item) => {
                const score = asNumber(item.value?.score);
                const tips = (item.value?.tips || [])
                    .map((tip) => normalizeTip(tip))
                    .filter((tip): tip is FeedbackTip => Boolean(tip));

                return {
                    label: item.label,
                    score,
                    tips,
                };
            })
            .filter((item) => item.score !== null || item.tips.length > 0);
    }, [parsedFeedback]);

    const genericTips = useMemo(() => {
        if (!parsedFeedback) return [];
        const mixed = [
            ...(parsedFeedback.improvements || []),
            ...(parsedFeedback.suggestions || []),
            ...(parsedFeedback.tips || []),
        ];

        return mixed
            .map((entry) => normalizeTip(entry))
            .filter((tip): tip is FeedbackTip => Boolean(tip));
    }, [parsedFeedback]);

    if (storeLoading || isFetching) {
        return <div className="p-20 text-center animate-pulse">Loading analysis...</div>;
    }

    if (error || !data) {
        return (
            <main className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
                <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                    <p className="text-gray-600 mb-6">{error || "No resume data found."}</p>
                    <button onClick={() => navigate("/upload")} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
                        Back to Upload
                    </button>
                </div>
            </main>
        );
    }

    const imageUrl = previewImageUrl || buildCloudUrl(data.imagePath);
    const pdfUrl = resumeFileUrl || buildCloudUrl(data.resumePath);

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="resume-nav">
                    <div>
                        <p className="text-sm text-gray-500">Analysis ID: {data.id}</p>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {data.jobTitle} at {data.companyName}
                        </h2>
                    </div>
                    <button onClick={() => navigate(-1)} className="back-button text-sm text-gray-700 hover:bg-gray-100">
                        Go Back
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6">
                    <section className="lg:col-span-4 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Resume Preview</h3>
                        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                            {imageUrl ? (
                                <a
                                    href={imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block"
                                    title="Open full-size preview"
                                >
                                    <img src={imageUrl} className="w-full" alt="Resume preview" />
                                </a>
                            ) : pdfUrl ? (
                                <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block relative"
                                    title="Open PDF resume"
                                >
                                    <iframe
                                        src={`${pdfUrl}#page=1&view=FitH`}
                                        className="w-full aspect-[3/4] pointer-events-none"
                                        title="Resume PDF preview"
                                    />
                                    <div className="absolute inset-0" />
                                </a>
                            ) : (
                                <div className="aspect-[3/4] bg-gray-50 text-gray-400 flex items-center justify-center">
                                    {isPreparingLinks ? "Preparing preview..." : "Preview not available"}
                                </div>
                            )}
                        </div>
                        {pdfUrl ? (
                            <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-center bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-black transition-all"
                            >
                                Open PDF Resume
                            </a>
                        ) : (
                            <button
                                type="button"
                                disabled
                                className="block w-full text-center bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold cursor-not-allowed"
                            >
                                {isPreparingLinks ? "Preparing resume link..." : "Resume link unavailable"}
                            </button>
                        )}
                        <p className="text-xs text-gray-500">Click the preview to open it in a new tab.</p>
                    </section>

                    <section className="lg:col-span-8 space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800">AI Feedback</h3>

                        {parsedFeedback ? (
                            <>
                                <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 flex flex-col md:flex-row items-center gap-6">
                                    <ScoreCircle score={overallScore || 0} />
                                    <div className="text-center md:text-left">
                                        <p className="text-sm text-gray-500">Overall ATS Score</p>
                                        <p className="text-3xl font-bold text-gray-900">{overallScore ?? "N/A"}/100</p>
                                        {parsedFeedback.summary && <p className="text-gray-600 mt-2">{parsedFeedback.summary}</p>}
                                    </div>
                                </div>

                                {categories.length > 0 && (
                                    <div className="space-y-4">
                                        {categories.map((category) => (
                                            <article key={category.label} className="border border-gray-100 rounded-2xl p-5">
                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                    <h4 className="font-semibold text-gray-900">{category.label}</h4>
                                                    {category.score !== null && (
                                                        <span className="score-badge bg-gray-100 text-gray-800 text-sm">
                                                            Score: {category.score}/100
                                                        </span>
                                                    )}
                                                </div>

                                                {category.tips.length > 0 ? (
                                                    <ul className="space-y-3">
                                                        {category.tips.map((tip, index) => {
                                                            const isPositive = tip.type === "good";
                                                            return (
                                                                <li key={`${category.label}-${index}`} className="border border-gray-100 rounded-xl p-3">
                                                                    <p className={`text-sm font-semibold ${isPositive ? "text-green-700" : "text-amber-700"}`}>
                                                                        {isPositive ? "Good" : "Needs Improvement"}
                                                                    </p>
                                                                    <p className="text-gray-800">{tip.tip}</p>
                                                                    {tip.explanation && <p className="text-sm text-gray-600 mt-1">{tip.explanation}</p>}
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-gray-500">No specific tips returned for this section.</p>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                )}

                                {categories.length === 0 && genericTips.length > 0 && (
                                    <article className="border border-gray-100 rounded-2xl p-5">
                                        <h4 className="font-semibold text-gray-900 mb-3">Suggestions</h4>
                                        <ul className="space-y-2">
                                            {genericTips.map((tip, index) => (
                                                <li key={`generic-tip-${index}`} className="text-gray-700">
                                                    - {tip.tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                )}
                            </>
                        ) : (
                            <article className="bg-white border rounded-2xl p-5">
                                <p className="text-sm text-gray-500 mb-2">
                                    The AI response was not valid JSON. Showing the raw response instead:
                                </p>
                                <pre className="whitespace-pre-wrap text-gray-700 text-sm">{data.feedback}</pre>
                            </article>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
};

export default Resume;
