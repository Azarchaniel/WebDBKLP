import {IAutor} from "../../server/src/types";

interface IBook {
    _id: string;
    autor: string[]; //id[]
    title: string;
    subtitle?: string;
    ISBN?: string;
    language: string[];
    numberOfPages: number;
    note: string;
    published: Published;
    exLibris: boolean;
    createdAt?: string;
    updatedAt?: string;
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
