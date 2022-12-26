export type Review = {
    id: string;
    rate: number;
    text: string;
    user: User;
    edited: boolean;
    timestamp: number;
    anonymous: boolean;
}