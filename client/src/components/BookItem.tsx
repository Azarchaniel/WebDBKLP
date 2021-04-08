import React from "react";
import {BookProps, IBook} from "../type";

type Props = BookProps & {
    updateBook: (book: IBook) => void
    deleteBook: (_id: string) => void
}

const Book: React.FC<Props> = ({book, updateBook, deleteBook}) => {
   const ifPublished = () => {
        if (book.published) {
            return (
                <>
                    <p>Krajina vydania: {book.published.country}</p>
                    <p>Vydavatel: {book.published.publisher}</p>
                    <p>Rok vydania: {book.published.year}</p>
                </>
            )
        }
    }

    return (
        <div className='Card'>
            <div className='Card--text'>
                <h1>Nazov: {book.title}</h1>
                <p>Podnazov: {book.subtitle}</p>
                <p>ISBN: {book.ISBN}</p>
                <p>Jazyk: {book.language}</p>
                <p>Poznamka: {book.note}</p>
                <p>Pocet stran: {book.numberOfPages}</p>
                {ifPublished()}
            </div>
            <div className='Card--button'>
                <button
                    onClick={() => updateBook(book)}
                    className='Card--button__done'
                >
                    Editovat
                </button>
                <button
                    onClick={() => deleteBook(book._id)}
                    className='Card--button__delete'
                >
                    Zmazat
                </button>
            </div>
        </div>
    )
}

export default Book
