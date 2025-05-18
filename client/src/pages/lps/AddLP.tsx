import {ILP, ValidationError} from "../../type";
import React, {useEffect, useState} from "react";
import {Modal} from "@components/Modal";
import {LPsModalBody} from "@components/lps/LPsModal";
import {ModalButtons} from "@components/Modal";

type Props = {
    saveLp: (formData: ILP | any) => void;
    onClose: () => void;
    lp?: ILP;
    saveResultSuccess?: boolean;
}

const AddLp: React.FC<Props> = ({saveLp, lp, onClose, saveResultSuccess}: Props) => {
    const [showModal, setShowModal] = useState<boolean>(Boolean(lp));
    const [lpData, setLpData] = useState<ILP | object>(lp || {});
    const [error, setError] = useState<ValidationError[] | undefined>([{
        label: "Názov LP musí obsahovať aspoň jeden znak!",
        target: "title"
    }]);
    const [outline, setOutline] = useState<React.CSSProperties>();

    const onChange = (data: any) => {
        setLpData(data);
    }

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
                    customKey={lp?._id || "new"}
                    title={(lp ? "Uprav" : "Pridaj") + " LP"}
                    onClose={() => {
                        setShowModal(false);
                        onClose();
                    }}
                    body={<LPsModalBody
                        data={lpData as ILP}
                        onChange={onChange}
                        error={setError}
                    />}
                    footer={<ModalButtons
                        onSave={() => saveLp(lpData as ILP)}
                        onClear={() => {
                            setLpData({});
                            setOutline({outline: "none"});
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