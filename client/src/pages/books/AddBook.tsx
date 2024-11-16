import React, {Fragment, useEffect, useState} from "react";
import {IBook} from "../../type";
import {Modal} from "../../components/Modal";
import {BooksModalBody, BooksModalButtons} from "../../components/books/BooksModal";

type Props = {
    saveBook: (formData: IBook | any) => void;
}

const AddBook: React.FC<Props> = ({saveBook}) => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const [bookData, setBookData] = useState<IBook | Object>();
    const [error, setError] = useState<any[] | undefined>([{label: 'Názov knihy musí obsahovať aspoň jeden znak!', target: 'title'}]);

    return (
        <>
            <button type="button" className="addBtnTable" onClick={() => setShowModal(true)}/>
            {showModal &&
                <Modal
                    title="Pridaj knihu"
                    onClose={() => setShowModal(false)}
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
