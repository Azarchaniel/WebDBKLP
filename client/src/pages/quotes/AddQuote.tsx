import {IQuote} from "../../type";
import React, {useState} from "react";
import ReactTooltip from "react-tooltip";
import {Modal} from "../../components/Modal";
import {QuotesModalBody, QuotesModalButtons} from "../../components/quotes/QuotesModal";

type Props = {
    saveQuote: (formData: IQuote | any) => void;
    id?: string | undefined;
}

const AddQuote: React.FC<Props> = ({saveQuote}: { saveQuote: any, id?: string | undefined }) => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const [quoteData, setQuoteData] = useState<IQuote | Object>();
    const [error, setError] = useState<string | undefined>('Text citátu musí obsahovať aspoň jeden znak!');

    return (
        <>
            <button type="button" className="addQuote" onClick={() => setShowModal(true)} data-tip="Pridaj citát"/>

            {showModal &&
                <Modal
                    title="Pridaj citát"
                    onClose={() => setShowModal(false)}
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
            <ReactTooltip place="bottom" effect="solid"/>
        </>
    )
        ;
}

export default AddQuote;