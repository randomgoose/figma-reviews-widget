export type Review = {
    id: string;
    rate: number;
    text: string;
    user: User;
    edited: boolean;
    timestamp: number;
    anonymous: boolean;
}

export type Sort = "ASCENDING_BY_TIME" | "DESCENDING_BY_TIME" | "ASCENDING_BY_RATE" | "DESCENDING_BY_RATE"

export const SORT: Sort[] = [
    "ASCENDING_BY_TIME",
    "DESCENDING_BY_TIME",
    "ASCENDING_BY_RATE",
    "DESCENDING_BY_RATE"
]

export type Lang = "zh-CN" | "en-US"