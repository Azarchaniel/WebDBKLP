import { IQuote } from "../../type";
import React, { useEffect, useState } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { useQuoteModal } from "@components/quotes/useQuoteModal";

interface Props {
	saveQuote: (formData: IQuote | any) => void;
	quote?: IQuote | undefined;
	saveResultSuccess?: boolean;
}

const AddQuote: React.FC<Props> = ({ saveQuote, quote, saveResultSuccess }: Props) => {
	const { openQuoteModal } = useQuoteModal();
	const [showButton, setShowButton] = useState<boolean>(true);

	// Handle immediate display if a quote is provided
	useEffect(() => {
		if (quote) {
			handleOpenModal();
		}
	}, [quote]);

	const handleOpenModal = () => {
		const { closeModal } = openQuoteModal(
			quote,
			(formData) => {
				saveQuote(formData);
				// Don't close automatically - let the context handle it
			},
			saveResultSuccess
		);

		// Optional: Store closeModal for later use
		return closeModal;
	};

	return (
		<>
			{showButton && (
				<button
					type="button"
					className="addQuote"
					onClick={handleOpenModal}
					data-tip="Pridaj citát"
				/>
			)}
			<ReactTooltip place="bottom" />
		</>
	);
}

export default AddQuote;