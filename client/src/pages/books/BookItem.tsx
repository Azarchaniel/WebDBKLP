import React from "react";
import {BookProps, IAutor, IBook, IUser} from "../../type";

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

    const ifOwner = () => {
        //if there is only one Owner, show only his name
        //if there are more Owners, show their name and comma. But last owner doesnt have a comma.
        if (book.owner && Array.isArray(book.owner)) {
            return book.owner.map((owner: IUser, index) => {
              return book.owner.length > 1 && book.owner.length-1 !== index ? `${owner.lastName} ${owner.firstName}, ` : `${owner.lastName} ${owner.firstName}`
            })
        }
    }

    return (
        <div className='Card'>
            <div className='Card--text'>
                <h1>Nazov: {book.title}</h1>
                <h2>Autor: {book.autor.map((autor: IAutor) => `${autor.lastName}, ${autor.firstName}`)}</h2>
                <p>Podnazov: {book.subtitle}</p>
                <p>ISBN: {book.ISBN}</p>
                <p>Jazyk: {book.language.length < 2 ? book.language[0] : book.language.join(", ")}</p>
                <p>Poznamka: {book.note}</p>
                <p>Pocet stran: {book.numberOfPages}</p>
                <p>Vlastník: {ifOwner()}</p>
                <p>Ex Libris: {book.exLibris ? '✓' : ''}</p>
                <p>Prečítané: </p>
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
