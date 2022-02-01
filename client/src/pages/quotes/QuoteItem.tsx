import React, {useEffect, useState} from "react";
import {IBook, IQuote} from "../../type";
import {getBook} from "../../API";
import {Tooltip} from "@material-ui/core";
import {isNumber} from "util";

type Props = { quote: IQuote, bcgrClr: string } & {
    updateQuote: (quote: IQuote) => void
    deleteQuote: (_id: string) => void
}

const Quote: React.FC<Props> = ({quote, bcgrClr, deleteQuote, updateQuote}) => {
    const [bookTitle, setBookTitle] = useState<IBook>();

    useEffect(() => {
        getBook(quote.fromBook).then((book) => {
            setBookTitle(book.data.book);
        }).catch(err => {throw new Error('Cant find book in QuoteItem' + err)});
    }, [quote])

    //todo: small etc. are just numbers. So try to divide or something, make bigger granularity
    const cssGrid = () => {
        if (quote.text.length < 300) {
            return 'Quote smallQ';
        } else if (quote.text.length < 500) {
            return 'Quote mediumQ';
        } else {
            return 'Quote largeQ';
        }
    }

    return (
        <div className={cssGrid()} style={{backgroundColor: bcgrClr}}>
            <div className='text'>
                <p>Text: {quote.text}</p>
                <p>Z knihy: {bookTitle?.title}{isNumber(quote.pageNo) ? ', ' + quote.pageNo : ''}</p>
            </div>
            <div className='Card--button'>
                <Tooltip title="Upraviť" placement="bottom">
                    <i className="fas fa-pen" onClick={() => updateQuote(quote)}/>
                </Tooltip>
                &nbsp;&nbsp;&nbsp;
                <Tooltip title="Vymazať" placement="bottom">
                    <i className="fas fa-trash" onClick={() => deleteQuote(quote._id)}/>
                </Tooltip>
            </div>
        </div>
    )
}

export default Quote
