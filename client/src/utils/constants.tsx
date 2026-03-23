import { SortingState } from "@tanstack/react-table";
import { IAutor, IBoardGame, IBook, ILP } from "type";
import { formatNumberLocale } from "./utils";

export const TABLE_HEADER_COLOR = getComputedStyle(document.documentElement).getPropertyValue("--anchor");

export const CITIES = [
    { value: "spisska", showValue: "Spišská" },
    { value: 'ujezd', showValue: 'Újezd u Chocně' },
    { value: "bruchotin", showValue: "Břuchotín" }
];

export const CHART_LABELS = (locale: string = 'en') => {
    return {
        generateLabels(chart: any) {
            const data = chart.data;
            return data.labels.map((label: any, i: number) => {
                const meta = chart.getDatasetMeta(0);
                const style = meta.controller.getStyle(i);

                return {
                    text: `${label} (${formatNumberLocale(chart.data.datasets[0].data[i] ?? 0, locale)})`,
                    fillStyle: style.backgroundColor,
                    strokeStyle: style.borderColor,
                    lineWidth: style.borderWidth,
                    hidden: !chart.getDataVisibility(i),
                    index: i
                };
            });
        }
    };
};

export const CHART_COLORS = [
    "#073b4c", "#118ab2", "#06d6a0", "#ffd166", "#f78c6b", "#ef476f"
]

export const AUTOR_ROLES = [
    { value: "autor", showValue: "autors.roleAutor" },
    { value: "editor", showValue: "autors.roleEditor" },
    { value: "ilustrator", showValue: "autors.roleIlustrator" },
    { value: "translator", showValue: "autors.roleTranslator" },
    { value: "musician", showValue: "autors.roleMusician" },
    { value: "boardGameAutor", showValue: "autors.roleBoardGameAutor" }
];

interface IPagination {
    page: number;
    pageSize: number;
    sorting: SortingState;
    search?: string;
    filters?: { id: string, value: string }[];
}

export const DEFAULT_PAGINATION: IPagination = Object.freeze({
    page: 1,
    pageSize: 50,
    search: "",
    sorting: [{
        id: "title",
        desc: false
    }] as SortingState,
    filters: []
});

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const EMPTY_BOOK: IBook = {
    _id: "",
    title: "",
    subtitle: "",
    autor: [],
    editor: [],
    ilustrator: [],
    translator: [],
    ISBN: "",
    language: [],
    note: "",
    numberOfPages: undefined,
    dimensions: undefined,
    exLibris: false,
    published: undefined,
    location: undefined,
    owner: [],
    readBy: [],
    picture: "",
    hrefGoodReads: "",
    hrefDatabazeKnih: "",
    content: [],
    edition: undefined,
    serie: undefined,
};

export const EMPTY_AUTOR: IAutor = {
    _id: "",
    firstName: "",
    lastName: "",
    nationality: [],
    dateOfBirth: undefined,
    dateOfDeath: undefined,
    role: [],
    note: ""
};

export const EMPTY_LP: ILP = {
    _id: "",
    autor: [],
    title: "",
    subtitle: "",
    countLp: 0,
    speed: 0,
    published: undefined,
    language: [],
    note: "",
};

export const EMPTY_BOARD_GAME: IBoardGame = {
    _id: "",
    title: "",
    image: "",
    noPlayers: undefined,
    playTime: undefined,
    ageRecommendation: undefined,
    published: undefined,
    autor: [],
    picture: "",
    url: "",
    note: "",
    parent: [],
    children: [],
};