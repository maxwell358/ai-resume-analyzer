import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    // Determine the appropriate unit by calculating the log
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Format with 2 decimal places and round
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// PascalCase wrapper with KB/MB/GB-only output as requested.
export function FormatSize(bytes: number): string {
    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;

    if (bytes <= 0) return '0 KB';
    if (bytes < mb) return `${parseFloat((bytes / kb).toFixed(2))} KB`;
    if (bytes < gb) return `${parseFloat((bytes / mb).toFixed(2))} MB`;
    return `${parseFloat((bytes / gb).toFixed(2))} GB`;
}

export const generateUUID = () => crypto.randomUUID();
