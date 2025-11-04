interface IBaseType {
    _id: string;
    deletedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IBook extends IBaseType {
    autor: IAutor[];
    editor?: IAutor[];
    ilustrator?: IAutor[];
    translator?: IAutor[];
    title: string;
    subtitle?: string;
    content?: string[];
    edition?: IEditionSerie;
    serie?: IEditionSerie;
    ISBN?: string;
    language?: ILangCode[];
    numberOfPages?: number;
    note?: string;
    published?: IPublished;
    location?: ILocation;
    exLibris?: boolean;
    owner?: IUser[];
    readBy?: IUser[];
    picture?: string;
    dimensions?: IDimension;
    hrefGoodReads?: string;
    hrefDatabazeKnih?: string;
    dimensions?: IDimension;
}

export interface ILP extends IBaseType {
    autor?: IAutor[];
    title: string;
    subtitle?: string;
    countLp: number;
    speed: number;
    published?: IPublished;
    language: ILangCode[];
    note: string;
}

interface ILocation {
    city: any;
    shelf?: string;
}

export interface IAutor extends IBaseType {
    firstName?: string;
    lastName: string;
    nationality?: any;
    dateOfBirth?: Date | string;
    dateOfDeath?: Date | string;
    note?: string;
    fullName?: string;
    role?: { value: string, showValue: string }[] | string[];
}

export interface IUser extends IBaseType {
    firstName?: string;
    lastName: string;
    hashedPassword?: string;
}

export interface IQuote extends IBaseType {
    text: string; //text or URL to pic
    fromBook: IBook;
    pageNo?: number;
    note?: string;
    owner: IUser[];
}

type ApiBookDataType = {
    message: string
    books: IBook[]
    book?: IBook
    count?: number
}

type ApiAutorDataType = {
    message: string
    autors: IAutor[]
    autor?: IAutor
    count?: number
    status?: number;
    latestUpdate?: Date;
}

type BelongToAutor = {
    id?: string;
    books: IBook[];
    lps: ILP[];
}

type ApiQuoteDataType = {
    message: string
    quotes: IQuote[]
    quote?: IQuote
    count?: number
}

type ApiLPDataType = {
    message: string
    lps: ILP[]
    lp?: ILP
    count?: number
}

type ApiUserDataType = {
    message: string
    users: IUser[]
    user?: IUser
}

type AutorProps = {
    autor: IAutor
}

interface IPublished {
    publisher?: string;
    year?: number;
    country?: ILangCode[];
}

export interface IDimension {
    height: number;
    width: number;
    thickness: number;
    weight?: number;
}

export interface ILangCode {
    key: string;
    value: string;
}

export interface ISideMenuItems {
    title: string;
    icon?: string;
    route: string;
    children?: ISideMenuItems[];
}

interface IEditionSerie {
    no?: number;
    title: string;
}

export interface IBookColumnVisibility {
    [columnId: string]: boolean
}

export interface ValidationError {
    label: string;
    valid?: boolean;
    target?: string;
}

interface IDimensionStat {
    sum: number;
    avg: number;
    min: number;
    max: number;
    median: number;
    mode: number;
}

//fixme: this is wrong type
export interface IDimensionsStatistics {
    height: IDimension;
    width: IDimension;
    thickness: IDimension;
    weight: IDimension;
}

export interface ILanguageStatistics {
    language: string;
    count: number;
}

interface IUserStatistics {
    user: string;
    count: number;
    ratio: number;
}

interface IUserReadingStats {
    name: string;
    stats: IUserStatistics[];
}

export interface IUniqueFilterValues {
    autor?: any[];
    editor?: any[];
    ilustrator?: any[];
    translator?: any[];
    title?: any[];
    subtitle?: any[];
    content?: any[];
    "edition.no"?: any[];
    "edition.title"?: any[];
    "serie.no"?: any[];
    "serie.title"?: any[];
    ISBN?: any[];
    language?: any[];
    note?: any[];
    numberOfPages?: any[];
    "dimensions.height"?: any[];
    "dimensions.width"?: any[];
    "dimensions.thickness"?: any[];
    "dimensions.weight"?: any[];
    exLibris?: any[];
    "published.publisher"?: any[];
    "published.year"?: any[];
    "published.country"?: any[];
    "location.city"?: any[];
    "location.shelf"?: any[];
    owner?: any[];
    readBy?: any[];
    fullName?: any[]
}

export interface IUniqueFilterValues {
    autor?: any[];
    editor?: any[];
    ilustrator?: any[];
    translator?: any[];
    title?: any[];
    subtitle?: any[];
    content?: any[];
    "edition.no"?: any[];
    "edition.title"?: any[];
    "serie.no"?: any[];
    "serie.title"?: any[];
    ISBN?: any[];
    language?: any[];
    note?: any[];
    numberOfPages?: any[];
    "dimensions.height"?: any[];
    "dimensions.width"?: any[];
    "dimensions.thickness"?: any[];
    "dimensions.weight"?: any[];
    exLibris?: any[];
    "published.publisher"?: any[];
    "published.year"?: any[];
    "published.country"?: any[];
    "location.city"?: any[];
    "location.shelf"?: any[];
    owner?: any[];
    readBy?: any[];
    fullName?: any[]
}

export type TRange = {
    from?: number;
    to?: number;
};

export interface IBoardGame {
    _id: string;
    title: string;
    image?: string;
    noPlayers?: TRange;
    playTime?: TRange;
    ageRecommendation?: TRange;
    published?: IPublished;
    autor?: string[];
    picture?: string;
    url?: string;
    note?: string;
    parent?: IBoardGame[];
    children?: IBoardGame[];
}

export type SaveEntity<T> = T | T[] | object;

export interface SaveEntityResult {
    success: boolean;
    message: string;
}