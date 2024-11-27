import "react-datepicker/dist/react-datepicker.css";
import React, {useEffect, useState} from "react";
import {IAutor, ValidationError} from "../../type";
import {Modal} from "../../components/Modal";
import {AutorsModalBody, AutorsModalButtons} from "../../components/autors/AutorsModal";

interface Props {
    saveAutor: (formData: IAutor) => void
    autor?: IAutor;
}

const AddAutor: React.FC<Props> = ({saveAutor, autor}: Props) => {
	const [showModal, setShowModal] = useState(false);
	const [autorData, setAutorData] = useState<IAutor | object>();
	const [error, setError] = useState<ValidationError[] | undefined>([{label: "Priezvisko autora musí obsahovať aspoň jeden znak!", target: "lastName"}]);

	useEffect(() => {
		if (autor) {
			setShowModal(true);
			setAutorData(autor);
		}
	}, []);

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
