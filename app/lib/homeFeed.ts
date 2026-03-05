const HOME_FEED_ITEMS_KEY = "resumind:home-feed-items";
const HOME_FEED_WIPED_KEY = "resumind:home-feed-wiped";

export type HomeFeedResume = {
    id: string;
    companyName: string;
    jobTitle: string;
    imagePath: string;
    resumePath: string;
    feedback: {
        overallScore: number;
    };
};

const isBrowser = () => typeof window !== "undefined";

export const readHomeFeedItems = (): HomeFeedResume[] => {
    if (!isBrowser()) return [];
    const raw = window.localStorage.getItem(HOME_FEED_ITEMS_KEY);
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item) => item && typeof item === "object") as HomeFeedResume[];
    } catch {
        return [];
    }
};

export const writeHomeFeedItems = (items: HomeFeedResume[]) => {
    if (!isBrowser()) return;
    window.localStorage.setItem(HOME_FEED_ITEMS_KEY, JSON.stringify(items));
};

export const addHomeFeedItem = (item: HomeFeedResume) => {
    const existing = readHomeFeedItems().filter((entry) => entry.id !== item.id);
    writeHomeFeedItems([item, ...existing]);
};

export const clearHomeFeed = () => {
    if (!isBrowser()) return;
    window.localStorage.removeItem(HOME_FEED_ITEMS_KEY);
};

export const isHomeFeedWiped = () => {
    if (!isBrowser()) return false;
    return window.localStorage.getItem(HOME_FEED_WIPED_KEY) === "true";
};

export const setHomeFeedWiped = (wiped: boolean) => {
    if (!isBrowser()) return;
    window.localStorage.setItem(HOME_FEED_WIPED_KEY, wiped ? "true" : "false");
};
