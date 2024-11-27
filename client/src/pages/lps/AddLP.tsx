import {ILP} from "../../type";
import React, {useEffect, useState} from "react";
import {Modal} from "../../components/Modal";
import {LPsModalBody, LPsModalButtons} from "../../components/lps/LPsModal";

type Props = {
    saveLp: (formData: ILP | any) => void;
    lp?: ILP;
}

const AddLp: React.FC<Props> = ({saveLp, lp}: Props) => {
	const [showModal, setShowModal] = useState<boolean>(false);
	const [lpData, setLpData] = useState<ILP | object>();
	const [error, setError] = useState<string | undefined>("Názov LP musí obsahovať aspoň jeden znak!");

	useEffect(() => {
		if (lp) {
			setLpData(lp);
			setShowModal(true);
		}
	}, []);

	const onChange = (data: any) => {
		console.log(data);
		setLpData(data);
	}

	return (
		<>
			<button type="button" className="addBtnTable" onClick={() => setShowModal(true)}/>
			{showModal &&
                <Modal
                	title="Pridaj LP"
                	onClose={() => setShowModal(false)}
                	body={<LPsModalBody
                		data={lpData as ILP}
                		onChange={onChange}
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