export type FeedbackTip = {
    type?: "good" | "improve" | string;
    tip?: string;
    explanation?: string;
};

type FeedbackCategory = {
    score?: number | string;
    tips?: unknown[];
};

export type ParsedFeedback = {
    overallScore?: number | string;
    score?: number | string;
    ats_score?: number | string;
    summary?: string;
    improvements?: unknown[];
    suggestions?: unknown[];
    tips?: unknown[];
    ATS?: FeedbackCategory;
    toneAndStyle?: FeedbackCategory;
    content?: FeedbackCategory;
    structure?: FeedbackCategory;
    skills?: FeedbackCategory;
};

export const parseJsonObject = (input: string): ParsedFeedback | null => {
    const attempts = [
        input.trim(),
        input.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim(),
    ];

    for (const attempt of attempts) {
        try {
            const parsed = JSON.parse(attempt) as unknown;
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as ParsedFeedback;
        } catch {
            // Continue trying parsing strategies.
        }

        const matched = attempt.match(/\{[\s\S]*\}/);
        if (!matched) continue;

        try {
            const parsed = JSON.parse(matched[0]) as unknown;
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as ParsedFeedback;
        } catch {
            // Keep fallback behavior in render.
        }
    }

    return null;
};

export const asNumber = (value: unknown): number | null => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.min(100, Math.round(parsed)));
};

export const normalizeTip = (tip: unknown): FeedbackTip | null => {
    if (typeof tip === "string") return { type: "improve", tip };
    if (!tip || typeof tip !== "object") return null;

    const value = tip as Record<string, unknown>;
    const text = typeof value.tip === "string" ? value.tip : null;
    if (!text) return null;

    return {
        type: typeof value.type === "string" ? value.type : "improve",
        tip: text,
        explanation: typeof value.explanation === "string" ? value.explanation : undefined,
    };
};

export const buildCloudUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/images/") || path.startsWith("/resumes/")) return path;
    return "";
};
