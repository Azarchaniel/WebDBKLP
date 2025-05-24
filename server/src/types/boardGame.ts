import {TPublished} from "./published";

type TRange = {
    from?: number;
    to?: number;
}

export interface IBoardGame {
    _id: string;
    title: string;
    noPlayers?: TRange;
    playTime?: TRange;
    ageRecommendation?: TRange;
    published?: TPublished;
    autor?: string[];
    picture?: string;
    url?: string;
    note?: string;
    parent?: string[];
    children?: string[];
}