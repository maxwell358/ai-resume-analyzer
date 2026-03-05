interface FSItem {
    id: string;
    uid: string;
    name: string;
    path: string;
    is_dir: boolean;
    parent_id: string;
    parent_uid: string;
    created: number;
    modified: number;
    accessed: number;
    size: number | null;
    writable: boolean;
}

interface PuterUser {
    uuid: string;
    username: string;
}

interface ChatMessageContent {
    type: "file" | "text";
    puter_path?: string;
    text?: string;
}

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string | ChatMessageContent[];
}

interface PuterAuth {
    isSignedIn: () => Promise<boolean>;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    getUser: () => Promise<PuterUser>;
}

interface PuterFS {
    upload: (files: File[]) => Promise<FSItem[] | FSItem>;
    getReadURL: (path: string) => Promise<string>;
    delete: (paths: string | string[]) => Promise<void>;
}

interface PuterKVPair<T = unknown> {
    key: string;
    value: T;
}

interface PuterKVListPage<T = unknown> {
    items: T[];
    cursor?: string;
}

interface PuterKV {
    get: (key: string) => Promise<string | undefined>;
    set: (key: string, value: string) => Promise<boolean>;
    del: (key: string) => Promise<boolean>;
    flush: () => Promise<boolean>;
    list: {
        (pattern?: string, returnValues?: false): Promise<string[]>;
        <T = unknown>(pattern: string, returnValues: true): Promise<PuterKVPair<T>[]>;
        <T = unknown>(options: {
            pattern?: string;
            returnValues: true;
            limit?: number;
            cursor?: string;
        }): Promise<PuterKVListPage<PuterKVPair<T>> | PuterKVPair<T>[]>;
    };
}

interface PuterAI {
    chat: (messages: ChatMessage[]) => Promise<unknown>;
}

interface PuterSDK {
    auth: PuterAuth;
    fs: PuterFS;
    kv: PuterKV;
    ai: PuterAI;
}

interface Window {
    puter?: PuterSDK;
}
