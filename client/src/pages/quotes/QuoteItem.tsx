import React, {useEffect, useState} from "react";
import {IQuote} from "../../type";
import {addQuote} from "../../API";
import {Tooltip} from "@material-ui/core";
import AddQuote from "./AddQuote";
import { toast } from "react-toastify";
import {stringifyUsers} from "../../utils/utils";

type Props = { quote: IQuote, bcgrClr: string } & {
    deleteQuote: (_id: string) => void,
    saveQuote: (e: React.FormEvent, formData: IQuote) => void
}

const Quote: React.FC<Props> = ({quote, bcgrClr, deleteQuote, saveQuote}) => {
    const [update, setUpdate] = useState(false);

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
                <p>Text: {quote?.text}</p>
                {quote.fromBook && quote.fromBook?.title ? <p>Z knihy: {quote.fromBook?.title}{quote.pageNo ? ', ' + quote.pageNo : ''}</p>
                    : <></>}
                {quote.owner ? <span>Majiteľ: {stringifyUsers(quote.owner, false)}</span> : <></>}
            </div>
            <div className='Card--button'>
                <Tooltip title="Upraviť" placement="bottom">
                    <i className="fas fa-pen" onClick={() => setUpdate(true)}/>
                </Tooltip>
                &nbsp;&nbsp;&nbsp;
                <Tooltip title="Vymazať" placement="bottom">
                    <i className="fas fa-trash" onClick={() => deleteQuote(quote._id)}/>
                </Tooltip>
            </div>
            {update ? <AddQuote saveQuote={saveQuote} id={quote._id}/> : <></>}
        </div>
    )
}

export default Quote;
