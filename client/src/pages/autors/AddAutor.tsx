import "react-datepicker/dist/react-datepicker.css";
import React, {useEffect, useState} from "react";
import {IAutor, ValidationError} from "../../type";
import {Modal} from "@components/Modal";
import {AutorsModalBody} from "@components/autors/AutorsModal";
import {ModalButtons} from "@components/Modal";

interface Props {
    saveAutor: (formData: IAutor) => void;
    onClose: () => void;
    autor?: IAutor;
    saveResultSuccess?: boolean;
}

const AddAutor: React.FC<Props> = ({saveAutor, autor, onClose, saveResultSuccess}: Props) => {
    const [showModal, setShowModal] = useState(Boolean(autor));
    const [autorData, setAutorData] = useState<IAutor | object>(autor || {});
    const [error, setError] = useState<ValidationError[] | undefined>([{
        label: "Priezvisko autora musí obsahovať aspoň jeden znak!",
        target: "lastName"
    }]);
    const [outline, setOutline] = useState<React.CSSProperties>();

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
            <button type="button" className="addBtnTable" onClick={() => setShowModal(true)}/>
            {showModal &&
                <Modal
                    customKey={autor?._id || "new"}
                    title={(autor ? "Uprav" : "Pridaj") + " autora"}
                    onClose={() => {
                        setShowModal(false);
                        onClose();
                    }}
                    body={<AutorsModalBody
                        data={autorData as IAutor}
                        onChange={setAutorData}
                        error={setError}
                    />}
                    footer={<ModalButtons
                        onSave={() => saveAutor(autorData as IAutor)}
                        onClear={() => {
                            setAutorData({});
                            setOutline({outline: "none"});
                        }}
                        error={error}
                        saveResultSuccess={saveResultSuccess}
                    />}
                    overrideStyle={outline}
                />
            }

        </>
    )
}

export default AddAutor
