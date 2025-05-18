import {IQuote, ValidationError} from "../../type";
import React, {useEffect, useState} from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import {Modal} from "@components/Modal";
import {QuotesModalBody} from "@components/quotes/QuotesModal";
import {ModalButtons} from "@components/Modal";

interface Props {
    saveQuote: (formData: IQuote | any) => void;
	onClose: () => void;
    quote?: IQuote | undefined;
	saveResultSuccess?: boolean;
}

const AddQuote: React.FC<Props> = ({saveQuote, quote, onClose, saveResultSuccess}: Props) => {
	const [showModal, setShowModal] = useState<boolean>(false);
	const [quoteData, setQuoteData] = useState<IQuote | object>();
	const [error, setError] = useState<ValidationError[] | undefined>([{label: "Text citátu musí obsahovať aspoň jeden znak!", target: "text"}]);
	const [outline, setOutline] = useState<React.CSSProperties>();

	useEffect(() => {
		if (quote) {
			setShowModal(true);
			setQuoteData(quote);
		}
	}, []);

	useEffect(() => {
		switch (saveResultSuccess) {
			case true:
				setOutline({outline: "10px solid green"});
				break;
			case false:
				setOutline({outline: "10px solid red"});
				break;
			default:
				setOutline({outline: "none"});
				break;
		}
	}, [saveResultSuccess]);

	return (
		<>
			<button type="button" className="addQuote" onClick={() => setShowModal(true)} data-tip="Pridaj citát"/>

			{showModal &&
                <Modal
					customKey={quote?._id || "new"}
					title={(quote ? "Uprav" : "Pridaj") + " citát"}
                	onClose={() => {
                		setShowModal(false);
                		onClose();
                	}}
                	body={<QuotesModalBody
                		data={quoteData as IQuote}
                		onChange={setQuoteData}
                		error={setError}
                	/>}
                	footer={<ModalButtons
                		onSave={() => saveQuote(quoteData as IQuote)}
                		onClear={() => setQuoteData({})}
                		error={error}
						saveResultSuccess={saveResultSuccess}
                	/>}
					overrideStyle={outline}
                />
			}
			<ReactTooltip place="bottom"/>
		</>
	)
	;
}

export default AddQuote;