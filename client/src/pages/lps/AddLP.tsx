import { ILP, ValidationError } from "../../type";
import React, { useEffect, useState } from "react";
import { Modal } from "@components/Modal";
import { LPsModalBody } from "@components/lps/LPsModal";
import { ModalButtons } from "@components/Modal";


type Props = {
    saveLp: (formData: ILP[] | ILP | object) => void;
    onClose: () => void;
    lps?: ILP[];
    saveResultSuccess?: boolean;
}

const AddLp: React.FC<Props> = ({ saveLp, lps, onClose, saveResultSuccess }: Props) => {
    const [showModal, setShowModal] = useState<boolean>(Boolean(lps));
    const [lpData, setLpData] = useState<ILP[] | ILP | object | undefined>(lps);
    const [error, setError] = useState<ValidationError[] | undefined>([{
        label: "Názov LP musí obsahovať aspoň jeden znak!",
        target: "title"
    }]);
    const [outline, setOutline] = useState<React.CSSProperties>();

    const onChange = (data: ILP[] | ILP | object) => {
        setLpData(data);
    }

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
            {!lps && <button type="button" className="addBtnTable" onClick={() => setShowModal(true)} />}
            {showModal &&
                <Modal
                    customKey={lps?.[0]?._id || "new"}
                    title={(lps ? "Uprav" : "Pridaj") + (Array.isArray(lps) && lps.length > 1 ? ` ${lps.length} LP` : " LP")}
                    onClose={() => {
                        setShowModal(false);
                        onClose();
                    }}
                    body={<LPsModalBody
                        data={lpData as ILP[] | ILP | object}
                        onChange={onChange}
                        error={setError}
                    />}
                    footer={<ModalButtons
                        onSave={() => saveLp(lpData as ILP[])}
                        onClear={() => {
                            setLpData([{} as ILP]);
                            setOutline({ outline: "none" });
                        }}
                        onRevert={() => {
                            setLpData(lps ?? [{} as ILP]);
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

export default AddLp;