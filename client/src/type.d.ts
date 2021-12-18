interface IBaseType {
    _id: string;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface IBook extends IBaseType {
    autor: IAutor[];
    title: string;
    subtitle?: string;
    ISBN?: string;
    language: string[];
    numberOfPages: number;
    note: string;
    published: IPublished;
    exLibris: boolean;
    owner: IUser[];
    readBy: IUser[];
    picture: string;
    dimensions: IDimension;
}

export interface ILP extends IBaseType {
    autor?: IAutor[];
    title: string;
    subtitle?: string;
    edition?: TEditionSerie;
    countLp: number;
    speed: number;
    published: TPublished;
    language: string;
    note: string;
}

export interface IAutor extends IBaseType {
    firstName?: string;
    lastName: string;
    nationality?: string;
    dateOfBirth?: Date;
    dateOfDeath?: Date;
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
    fromBook: string; //id
    note?: string;
}

type BookProps = {
    book: IBook
}

type ApiBookDataType = {
    message: string
    books: IBook[]
    book?: IBook
}

type ApiAutorDataType = {
    message: string
    autors: IAutor[]
    autor?: IAutor
}

type ApiQuoteDataType = {
    message: string
    quotes: IQuote[]
    quote?: IQuote
}

type ApiLPDataType = {
    message: string
    lps: ILP[]
    lp?: ILP
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
    country?: string;
}

interface IDimension {
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
