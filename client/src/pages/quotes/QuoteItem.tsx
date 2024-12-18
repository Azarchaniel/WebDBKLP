import React, {useState} from "react";
import {IQuote} from "../../type";
import AddQuote from "./AddQuote";
import {formPersonsFullName, stringifyUsers} from "../../utils/utils";

type Props = { quote: IQuote, bcgrClr: string } & {
    deleteQuote: (_id: string) => void,
    saveQuote: (formData: IQuote) => void
}

const Quote: React.FC<Props> = ({quote, bcgrClr, deleteQuote, saveQuote}) => {
	const [update, setUpdate] = useState(false);

	const cssGrid = () => {
		if (quote.text.length < 300) {
			return "Quote smallQ";
		} else if (quote.text.length < 500) {
			return "Quote mediumQ";
		} else {
			return "Quote largeQ";
		}
	}

	return (
		<div key={quote._id} className={cssGrid()} style={{backgroundColor: bcgrClr}}>
			<div className='text'>
				{quote.fromBook && quote.fromBook?.title && <h4>{quote.fromBook?.title}{quote.pageNo ? ", s. " + quote.pageNo : ""}</h4>}
				{quote.fromBook?.autor && <p><span className="quoteOwner">{formPersonsFullName(quote.fromBook?.autor[0])?.toString as any}</span></p>}
				<p>{quote?.text}</p>
				{quote.owner && <p><span className="quoteOwner">Pridal: {stringifyUsers(quote.owner, false)}</span></p>}
				{quote.note && <p><span className="quoteOwner">Poznámka: {quote.note}</span></p>}
			</div>
			<div className='Card--button'>
				<i className="fas fa-pen" onClick={() => setUpdate(true)}/>
                &nbsp;&nbsp;&nbsp;
				<i className="fas fa-trash" onClick={() => deleteQuote(quote._id)}/>
			</div>
			{update && <AddQuote saveQuote={saveQuote} id={quote._id}/>}
		</div>
	)
}

export default Quote;
