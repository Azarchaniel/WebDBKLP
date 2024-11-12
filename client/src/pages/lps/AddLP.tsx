import {ILP} from "../../type";
import React, {useState} from "react";
import {Modal} from "../../components/Modal";
import {LPsModalBody, LPsModalButtons} from "../../components/lps/LPsModal";

type Props = {
    saveLp: (formData: ILP | any) => void
}

const AddLp: React.FC<Props> = ({saveLp}: { saveLp: any }) => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const [lpData, setLpData] = useState<ILP | Object>();
    const [error, setError] = useState<string | undefined>('Názov LP musí obsahovať aspoň jeden znak!');

    return (
        <>
            <button type="button" className="addBtnTable" onClick={() => setShowModal(true)}/>
            {showModal &&
                <Modal
                    title="Pridaj LP"
                    onClose={() => setShowModal(false)}
                    body={<LPsModalBody
                        data={lpData as ILP}
                        onChange={setLpData}
                        error={setError}
                    />}
                    footer={<LPsModalButtons
                        saveLP={() => saveLp(lpData as ILP)}
                        cleanFields={() => setLpData({})}
                        error={error}
                    />}
                />
            }
        </>
    );
}

export default AddLp;