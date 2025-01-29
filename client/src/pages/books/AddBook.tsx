import React, {useEffect, useState} from "react";
import {IBook, ValidationError} from "../../type";
import {Modal} from "../../components/Modal";
import {BooksModalBody, BooksModalButtons} from "../../components/books/BookModal";

type Props = {
	key: string;
    saveBook: (formData: IBook | any) => void;
	onClose: () => void;
    book?: IBook;
}

const AddBook: React.FC<Props> = ({key, saveBook, book, onClose}) => {
	const [showModal, setShowModal] = useState<boolean>(false);
	const [bookData, setBookData] = useState<IBook | object>();
	const [error, setError] = useState<ValidationError[] | undefined>([{label: "Názov knihy musí obsahovať aspoň jeden znak!", target: "title"}]);

	useEffect(() => {
		if (book) {
			setBookData(book);
			setShowModal(true);
		}
	}, []);

	return (
		<>
			{!book && <button type="button" className="addBtnTable" onClick={() => setShowModal(true)}/>}
			{showModal &&
                <Modal
					key={key}
                	title="Pridaj knihu"
                	onClose={() => {
                		setShowModal(false);
                		onClose();
                	}}
                	body={<BooksModalBody
                		data={bookData as IBook}
                		onChange={setBookData}
                		error={setError}
                	/>}
                	footer={<BooksModalButtons
                		saveBook={() => saveBook(bookData as IBook)}
                		cleanFields={() => setBookData({})}
                		error={error}
                	/>}
                />
			}
		</>
	);
}

export default AddBook
