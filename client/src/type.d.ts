interface IBook {
    _id: string
    title: string
    subtitle?: string
    ISBN?: string;
    language: string;
    numberOfPages: number;
    note: string;
    published: Published;
    createdAt?: string;
    updatedAt?: string;
}

type BookProps = {
    book: IBook
}

type ApiDataType = {
    message: string
    books: IBook[]
    book?: IBook
  }

export type Published = {
    publisher?: string;
    year?: number;
    country?: string;
}
