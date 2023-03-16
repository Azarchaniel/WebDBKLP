import React, {useEffect, useState} from "react";
import {IQuote} from "../../type";
import {addQuote} from "../../API";
import {Tooltip} from "@material-ui/core";
import AddQuote from "./AddQuote";
import { toast } from "react-toastify";
import {stringifyUsers} from "../../utils/utils";

type Props = { quote: IQuote, bcgrClr: string } & {
    deleteQuote: (_id: string) => void
}

const Quote: React.FC<Props> = ({quote, bcgrClr, deleteQuote}) => {
    const [update, setUpdate] = useState(false);

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

    const handleSaveQuote = (e: React.FormEvent, formData: IQuote): void => {
        e.preventDefault()
        addQuote(formData)
            .then(({status}) => {
                if (status !== 201) {
                    throw new Error('Citát sa nepodarilo pridať!')
                }
                toast.success(`Citát bol úspešne ulozeny.`);
                //TODO: call parent to refresh quotes
            })
            .catch((err) => {
                toast.error(`Citát sa nepodarilo ulozit!`);
                console.trace(err);
            })
    }

    return (
        <div className={cssGrid()} style={{backgroundColor: bcgrClr}}>
            <div className='text'>
                <p>Text: {quote?.text}</p>
                {quote.fromBook && quote.fromBook?.title ? <p>Z knihy: {quote.fromBook?.title}{quote.pageNo ? ', ' + quote.pageNo : ''}</p>
                    : <></>}
                {quote.owner ? <p>Majiteľ: {stringifyUsers(quote.owner, false)}</p> : <></>}
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
            {update ? <AddQuote saveQuote={handleSaveQuote} id={quote._id}/> : <></>}
        </div>
    )
}

export default Quote;
