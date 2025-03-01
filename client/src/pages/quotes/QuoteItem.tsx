import React, {useState} from "react";
import {IQuote} from "../../type";
import AddQuote from "./AddQuote";
import {formPersonsFullName, stringifyUsers} from "../../utils/utils";
import {Wysiwyg} from "../../components/Wysiwyg";
import {isUserLoggedIn} from "../../utils/user";

type Props = { quote: IQuote, bcgrClr: string } & {
	deleteQuote: (_id: string) => void,
	saveQuote: (formData: IQuote) => void
}

const Quote: React.FC<Props> = ({quote, bcgrClr, deleteQuote, saveQuote}) => {
	const [update, setUpdate] = useState<IQuote>();

	//TODO: sanitize HTML
	const makeImgClickable = (text: string) => {
		if (text.substring(0,4) === "<img") {
			const parser = new DOMParser();
			const doc = parser.parseFromString(text, "text/html");
			const imgElement = doc.querySelector("img");

			if (imgElement) {
				//open img on new tab, where it can be natively zoomable
				imgElement.setAttribute("onclick", `window.open('${imgElement.getAttribute("src")}', '_blank')`);
				imgElement.style.cursor = "pointer";
				return imgElement.outerHTML;
			} else {
				return text;
			}
		} else {
			return text;
		}
	}

	return (
		<div key={quote._id} className="Quote" style={{backgroundColor: bcgrClr}}>
			<div className='text'>
				{quote.fromBook && quote.fromBook?.title && <h4>{quote.fromBook?.title}{quote.pageNo ? ", s. " + quote.pageNo : ""}</h4>}
				{quote.fromBook?.autor && <p><span className="quoteOwner">{formPersonsFullName(quote.fromBook?.autor[0])?.toString as any}</span></p>}
				<Wysiwyg value={makeImgClickable(quote?.text)} onChange={() => {}} name="text" disabled={true} hideToolbar={true} />
				{quote.owner && <p><span className="quoteOwner">Pridal: {stringifyUsers(quote.owner, false)}</span></p>}
				{quote.note && <p><span className="quoteOwner">Poznámka: {quote.note}</span></p>}
			</div>
			{isUserLoggedIn() && <div className='Card--button'>
				<i className="fas fa-pen" onClick={() => setUpdate(quote)}/>
				&nbsp;&nbsp;&nbsp;
				<i className="fas fa-trash" onClick={() => deleteQuote(quote._id)}/>
			</div>}
			{Boolean(update) &&
				<AddQuote
					key={quote._id}
					saveQuote={saveQuote}
					quote={quote}
					onClose={() => setUpdate(undefined)}
				/>
			}
		</div>
	)
}

export default Quote;
