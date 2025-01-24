import {IEditionSerie} from "../../server/src/types";

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
    language: ILangCode[];
    numberOfPages: number;
    note: string;
    published: IPublished;
    location: ILocation;
    exLibris: boolean;
    owner: IUser[];
    readBy: IUser[];
    picture: string;
    dimensions?: IDimension;
    hrefGoodReads?: string;
    hrefDatabazeKnih?: string;
}

export interface ILP extends IBaseType {
    autor?: IAutor[];
    title: string;
    subtitle?: string;
    edition?: IEditionSerie;
    countLp: number;
    speed: number;
    published?: IPublished;
    language: ILangCode[];
    note: string;
}

interface ILocation {
    city: string;
    shelf?: string;
}

export interface IAutor extends IBaseType {
    firstName?: string;
    lastName: string;
    nationality?: string;
    dateOfBirth?: Date | string;
    dateOfDeath?: Date | string;
    note?: string;
    fullName?: string;
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

type BookProps = {
    book: IBook
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
    depth: number;
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

export interface IBookHidden {
    control: boolean,
    editor: boolean,
    ilustrator: boolean,
    translator: boolean,
    subtitle: boolean,
    content: boolean,
    dimensions: boolean,
    createdAt: boolean,
    location: boolean,
    owner: boolean
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

export interface IDimensionsStatistics {
    height: IDimension;
    width: IDimension;
    depth: IDimension;
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
    stats: IUserStatistics;
}