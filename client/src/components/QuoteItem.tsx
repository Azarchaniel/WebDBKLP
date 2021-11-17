import React, {useEffect, useState} from "react";
import {IBook, IQuote} from "../type";
import {getBook} from "../API";
import {throws} from "assert";

type Props = { quote: IQuote } & {
    updateQuote: (quote: IQuote) => void
    deleteQuote: (_id: string) => void
}

const Quote: React.FC<Props> = ({quote, deleteQuote, updateQuote}) => {
    const [bookTitle, setBookTitle] = useState<IBook>();

    useEffect(() => {
        getBook(quote.fromBook).then((book) => {
            console.log(book.data.book);
            setBookTitle(book.data.book);
        }).catch(err => {throw new Error('Cant find book in QuoteItem' + err)});
    }, [])


    return (
        <div className='Quote'>
            <div className='text'>
                <h1>Text: {quote.text}</h1>
                <p>Z knihy: {bookTitle?.title}</p>
            </div>
            <div className='Card--button'>
                <button
                    onClick={() => updateQuote(quote)}
                    className='Card--button__done'
                >
                    Editovat
                </button>
                <button
                    onClick={() => deleteQuote(quote._id)}
                    className='Card--button__delete'
                >
                    Zmazat
                </button>
            </div>
        </div>
    )
}

export default Quote
