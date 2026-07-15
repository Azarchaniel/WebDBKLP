import type { ComponentProps } from "react";

import type { BooksModalBody } from "../client/src/components/books/BookModal";
import type { AutorsModalBody } from "../client/src/components/autors/AutorsModal";
import type { LPsModalBody } from "../client/src/components/lps/LPsModal";
import type { BoardGamesModalBody } from "../client/src/components/boardGames/BoardGamesModal";
import type { QuotesModalBody } from "../client/src/components/quotes/QuotesModal";
import type { addBook } from "../client/src/api/booksApi";
import type { addAutor } from "../client/src/api/authorsApi";
import type { addLP } from "../client/src/api/lpsApi";
import type { addBoardGame } from "../client/src/api/boardGamesApi";
import type { addQuote } from "../client/src/api/quotesApi";
import type {
    IAutorModalInput,
    IBoardGameModalInput,
    IBookModalInput,
    ILPModalInput,
    IQuoteModalInput,
    IPublished,
    SaveEntity
} from "../client/src/type";
import type { SavePayload } from "../client/src/api/types";
import type { IBook as ServerBook } from "../server/src/types/book";
import type { IAutor as ServerAutor } from "../server/src/types/autor";
import type { ILp as ServerLP } from "../server/src/types/lp";
import type { IBoardGame as ServerBoardGame } from "../server/src/types/boardGame";
import type { IQuote as ServerQuote } from "../server/src/types/quote";

type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;
type IsEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type IsAssignable<From, To> = [From] extends [To] ? true : false;
type ArrayItem<T> = T extends readonly (infer Item)[] ? Item : never;
type FirstArg<T> = T extends (arg: infer Arg, ...rest: any[]) => any ? Arg : never;
type NotAny<T> = IsAny<T> extends true ? false : true;

type BookModalData = ComponentProps<typeof BooksModalBody>["data"];
type AutorModalData = ComponentProps<typeof AutorsModalBody>["data"];
type LPModalData = ComponentProps<typeof LPsModalBody>["data"];
type BoardGameModalData = ComponentProps<typeof BoardGamesModalBody>["data"];
type QuoteModalData = ComponentProps<typeof QuotesModalBody>["data"];

type _bookModalInput = Assert<IsEqual<ArrayItem<BookModalData>, IBookModalInput>>;
type _autorModalInput = Assert<IsEqual<ArrayItem<AutorModalData>, IAutorModalInput>>;
type _lpModalInput = Assert<IsEqual<ArrayItem<LPModalData>, ILPModalInput>>;
type _boardGameModalInput = Assert<IsEqual<ArrayItem<BoardGameModalData>, IBoardGameModalInput>>;
type _quoteModalInput = Assert<IsEqual<QuoteModalData, IQuoteModalInput>>;

type _bookApiPayload = Assert<IsEqual<FirstArg<typeof addBook>, SavePayload<IBookModalInput>>>;
type _autorApiPayload = Assert<IsEqual<FirstArg<typeof addAutor>, SavePayload<IAutorModalInput>>>;
type _lpApiPayload = Assert<IsEqual<FirstArg<typeof addLP>, SavePayload<ILPModalInput>>>;
type _boardGameApiPayload = Assert<IsEqual<FirstArg<typeof addBoardGame>, SavePayload<IBoardGameModalInput>>>;
type _quoteApiPayload = Assert<IsEqual<FirstArg<typeof addQuote>, SavePayload<IQuoteModalInput>>>;

type _saveEntityMatchesApiPayload = Assert<IsEqual<SaveEntity<IBookModalInput>, SavePayload<IBookModalInput>>>;
type _boardGameApiIsNotAny = Assert<NotAny<FirstArg<typeof addBoardGame>>>;
type _quoteApiIsNotAny = Assert<NotAny<FirstArg<typeof addQuote>>>;

type ServerPublishedInput = Omit<IPublished, "country"> & { country?: string };

type NormalizedBookPayload = Omit<IBookModalInput,
    "_id" | "createdAt" | "updatedAt" | "deletedAt" |
    "autor" | "editor" | "translator" | "ilustrator" | "readBy" | "owner" |
    "language" | "published" | "location"
> & {
    autor?: string[];
    editor?: string[];
    translator?: string[];
    ilustrator?: string[];
    readBy?: string[];
    owner?: string[];
    language?: string[];
    published?: ServerPublishedInput;
    location?: { city?: string; shelf?: string };
};

type NormalizedAutorPayload = Omit<IAutorModalInput,
    "_id" | "createdAt" | "updatedAt" | "deletedAt" | "nationality" | "role" | "dateOfBirth" | "dateOfDeath"
> & {
    nationality?: string;
    role?: string[];
    dateOfBirth?: Date;
    dateOfDeath?: Date;
};

type NormalizedLPPayload = Omit<ILPModalInput,
    "_id" | "createdAt" | "updatedAt" | "deletedAt" | "autor" | "language" | "published"
> & {
    autor?: string[];
    language: string[];
    published?: ServerPublishedInput;
};

type NormalizedBoardGamePayload = Omit<IBoardGameModalInput,
    "autor" | "parent" | "children" | "published"
> & {
    autor?: string[];
    parent?: string[];
    children?: string[];
    published?: ServerPublishedInput;
};

type NormalizedQuotePayload = Omit<IQuoteModalInput, "_id" | "createdAt" | "updatedAt" | "deletedAt" | "fromBook" | "owner"> & {
    fromBook: ServerBook;
    owner?: ServerQuote["owner"];
};

type _bookFitsServerType = Assert<IsAssignable<NormalizedBookPayload, Partial<ServerBook>>>;
type _autorFitsServerType = Assert<IsAssignable<NormalizedAutorPayload, Partial<ServerAutor>>>;
type _lpFitsServerType = Assert<IsAssignable<NormalizedLPPayload, Partial<ServerLP>>>;
type _boardGameFitsServerType = Assert<IsAssignable<NormalizedBoardGamePayload, Partial<ServerBoardGame>>>;
type _quoteFitsServerType = Assert<IsAssignable<NormalizedQuotePayload, Partial<ServerQuote>>>;

export {};