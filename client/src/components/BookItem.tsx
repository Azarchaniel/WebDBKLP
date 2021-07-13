import React, {useEffect, useState} from "react";
import {ApiAutorDataType, BookProps, IBook} from "../type";
import {AxiosResponse} from "axios";
import {getAutor} from "../API";

type Props = BookProps & {
    updateBook: (book: IBook) => void
    deleteBook: (_id: string) => void
}

const Book: React.FC<Props> = ({book, updateBook, deleteBook}) => {
    const [autors, setAutors] = useState<string>('');

    useEffect(() => {
        getAutors(book.autor);
    }, [])

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

    const getAutors = (autsId: string[]): void => {
        const promisArray: Promise<AxiosResponse<ApiAutorDataType>>[] = [];
        for (let id of autsId) {
            promisArray.push(getAutor(id));
        }
        Promise.all(promisArray)
            .then((aut: any) => {
                let autorsTemp = '';
                for (let autorFor of aut) {
                    const singleAut = autorFor.data.autor;
                    if (autorsTemp) autorsTemp += '; ';
                    autorsTemp += `${singleAut.lastName}, ${singleAut.firstName}`;
                }
                setAutors(autorsTemp);
            })
            .catch(err => {
                throw Error('Error retrieving autors in BookItem ' + err)
            })
    }

    return (
        <div className='Card'>
            <div className='Card--text'>
                <h1>Nazov: {book.title}</h1>
                <h2>Autor: {autors}</h2>
                <p>Podnazov: {book.subtitle}</p>
                <p>ISBN: {book.ISBN}</p>
                <p>Jazyk: {book.language.length < 2 ? book.language[0] : book.language.join(", ")}</p>
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
