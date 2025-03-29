import React, {useEffect, useState} from "react";
import {IBook, ValidationError} from "../../type";
import {Modal} from "../../components/Modal";
import {BooksModalBody, BooksModalButtons} from "../../components/books/BookModal";

type Props = {
    saveBook: (formData: IBook | any) => void;
	onClose: () => void;
    book?: IBook;
	saveResultSuccess?: boolean;
}

const AddBook: React.FC<Props> = ({saveBook, book, onClose, saveResultSuccess}: Props) => {
	const [showModal, setShowModal] = useState<boolean>(Boolean(book));
	const [bookData, setBookData] = useState<IBook | object>(book || {});
	const [error, setError] = useState<ValidationError[] | undefined>([{label: "Názov knihy musí obsahovať aspoň jeden znak!", target: "title"}]);
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
			{!book && <button type="button" className="addBtnTable" onClick={() => setShowModal(true)}/>}
			{showModal &&
                <Modal
					customKey={book?._id || "new"}
                	title={(book ? "Uprav" : "Pridaj") + " knihu"}
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
                		cleanFields={() => {
							setBookData({});
							setOutline({outline: "none"});
						}}
                		error={error}
                	/>}
					overrideStyle={outline}
                />
			}
		</>
	);
}

export default AddBook
