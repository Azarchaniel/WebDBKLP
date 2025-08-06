import "react-datepicker/dist/react-datepicker.css";

import React, { useEffect, useState } from "react";
import { IAutor, ValidationError } from "../../type";
import { Modal } from "@components/Modal";
import { AutorsModalBody } from "@components/autors/AutorsModal";
import { ModalButtons } from "@components/Modal";

type Props = {
    saveAutor: (formData: IAutor[] | object) => void;
    onClose: () => void;
    autors?: IAutor[];
    saveResultSuccess?: boolean;
}

const AddAutor: React.FC<Props> = ({ saveAutor, autors, onClose, saveResultSuccess }: Props) => {
    const [showModal, setShowModal] = useState<boolean>(Boolean(autors));
    const [autorData, setAutorData] = useState<IAutor[] | undefined>(autors);
    const [error, setError] = useState<ValidationError[] | undefined>([{
        label: "Priezvisko autora musí obsahovať aspoň jeden znak!",
        target: "lastName"
    }]);
    const [outline, setOutline] = useState<React.CSSProperties>();

    useEffect(() => {
        switch (saveResultSuccess) {
            case true:
                setOutline({ outline: "10px solid green" });
                break;
            case false:
                setOutline({ outline: "10px solid red" });
                break;
            default:
                setOutline({ outline: "none" });
                break;
        }
    }, [saveResultSuccess]);

    return (
        <>
            {!autors && <button type="button" className="addBtnTable" onClick={() => setShowModal(true)} />}
            {showModal &&
                <Modal
                    customKey={autors?.[0]?._id || "new"}
                    title={(autors ? "Uprav" : "Pridaj") + " autora"}
                    onClose={() => {
                        setShowModal(false);
                        onClose();
                    }}
                    body={<AutorsModalBody
                        data={autorData as IAutor[]}
                        onChange={(data: IAutor[] | object) => {
                            if (Array.isArray(data)) {
                                setAutorData(data as IAutor[]);
                            } else if (typeof data === "object") {
                                setAutorData([data as IAutor]);
                            } else {
                                setAutorData(undefined);
                            }
                        }}
                        error={setError}
                    />}
                    footer={<ModalButtons
                        onSave={() => saveAutor(autorData as IAutor[])}
                        onClear={() => {
                            setAutorData([{} as IAutor]);
                            setOutline({ outline: "none" });
                        }}
                        onRevert={() => {
                            setAutorData(autors ?? [{} as IAutor]);
                            setOutline({ outline: "none" });
                        }}
                        error={error}
                        saveResultSuccess={saveResultSuccess}
                    />}
                    overrideStyle={outline}
                />
            }
        </>
    );
}

export default AddAutor;
