import "react-datepicker/dist/react-datepicker.css";
import React, {useState} from "react";
import {IAutor} from "../../type";
import {Modal} from "../../components/Modal";
import {AutorsModalBody, AutorsModalButtons} from "../../components/autors/AutorsModal";

interface Props {
    saveAutor: (formData: IAutor) => void
}

const AddAutor: React.FC<Props> = ({saveAutor}: Props) => {
    const [showModal, setShowModal] = useState(false);
    const [autorData, setAutorData] = useState<IAutor | Object>();
    const [error, setError] = useState<string | undefined>('Priezvisko autora musí obsahovať aspoň jeden znak!');

    return (
        <>
            <button type="button" className="addBtnTable" onClick={() => setShowModal(true)}/>
            {showModal &&
                <Modal
                    title="Pridaj autora"
                    onClose={() => setShowModal(false)}
                    body={<AutorsModalBody
                        data={autorData as IAutor}
                        onChange={setAutorData}
                        error={setError}
                    />}
                    footer={<AutorsModalButtons
                        saveAutor={() => saveAutor(autorData as IAutor)}
                        cleanFields={() => setAutorData({})}
                        error={error}
                    />}
                />
            }

        </>
    )
}

export default AddAutor
