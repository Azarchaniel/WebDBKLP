interface IBaseType {
    _id: string;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface IBook extends IBaseType{
    autor: string[]; //id[]
    title: string;
    subtitle?: string;
    ISBN?: string;
    language: string[];
    numberOfPages: number;
    note: string;
    published: Published;
    exLibris: boolean;
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

export interface IQuote extends IBaseType {
    text: string; //text or URL to pic
    fromBook: string; //id
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

type AutorProps = {
    autor: IAutor
}

export type Published = {
    publisher?: string;
    year?: number;
    country?: string;
}

export type ILangCode = {
    key: string;
    value: string;
}

export interface ISideMenuItems {
    title: string;
    icon?: string;
    route: string;
    children?: ISideMenuItems[];
}
