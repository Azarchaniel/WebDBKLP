import {IQuote, ValidationError} from "../../type";
import React, {useEffect, useState} from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import {Modal} from "../../components/Modal";
import {QuotesModalBody, QuotesModalButtons} from "../../components/quotes/QuotesModal";

interface Props {
    saveQuote: (formData: IQuote | any) => void;
	onClose: () => void;
    quote?: IQuote | undefined;
}

const AddQuote: React.FC<Props> = ({saveQuote, quote, onClose}: Props) => {
	const [showModal, setShowModal] = useState<boolean>(false);
	const [quoteData, setQuoteData] = useState<IQuote | object>();
	const [error, setError] = useState<ValidationError[] | undefined>([{label: "Text citátu musí obsahovať aspoň jeden znak!", target: "text"}]);

	useEffect(() => {
		if (quote) {
			setShowModal(true);
			setQuoteData(quote);
		}
	}, []);

	return (
		<>
			<button type="button" className="addQuote" onClick={() => setShowModal(true)} data-tip="Pridaj citát"/>

			{showModal &&
                <Modal
                	title="Pridaj citát"
                	onClose={() => {
                		setShowModal(false);
                		onClose();
                	}}
                	body={<QuotesModalBody
                		data={quoteData as IQuote}
                		onChange={setQuoteData}
                		error={setError}
                	/>}
                	footer={<QuotesModalButtons
                		saveQuote={() => saveQuote(quoteData as IQuote)}
                		cleanFields={() => setQuoteData({})}
                		error={error}
                	/>}
                />
			}
			<ReactTooltip place="bottom"/>
		</>
	)
	;
}

export default AddQuote;