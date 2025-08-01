import React, { useEffect, useState } from "react";
import { IBook, ValidationError } from "../../type";
import { Modal } from "@components/Modal";
import { BooksModalBody } from "@components/books/BookModal";
import { ModalButtons } from "@components/Modal";
import { emptyBook } from "@utils";

type Props = {
    saveBook: (formData: IBook | object | IBook[]) => void;
    onClose: () => void;
    books?: IBook[];
    saveResultSuccess?: boolean;
}

const AddBook: React.FC<Props> = ({ saveBook, books, onClose, saveResultSuccess }: Props) => {
    const [showModal, setShowModal] = useState<boolean>(Boolean(books));
    const [bookData, setBookData] = useState<IBook[] | undefined>(books);
    const [error, setError] = useState<ValidationError[] | undefined>([{
        label: "Názov knihy musí obsahovať aspoň jeden znak!",
        target: "title"
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
            {!books && <button type="button" className="addBtnTable" onClick={() => setShowModal(true)} />}
            {showModal &&
                <Modal
                    customKey={books?.[0]?._id || "new"}
                    title={(books ? "Uprav" : "Pridaj") + " knihu"}
                    onClose={() => {
                        setShowModal(false);
                        onClose();
                    }}
                    body={<BooksModalBody
                        data={bookData as IBook[]}
                        onChange={(data: IBook | object | IBook[]) => {
                            // If data is an array of IBook, set directly; otherwise, wrap in array
                            if (Array.isArray(data)) {
                                setBookData(data as IBook[]);
                            } else if (typeof data === "object") {
                                setBookData([data as IBook]);
                            } else {
                                setBookData(undefined);
                            }
                        }}
                        error={setError}
                    />}
                    footer={<ModalButtons
                        onSave={() => saveBook(bookData as IBook[])}
                        onClear={() => {
                            setBookData([emptyBook]);
                            setOutline({ outline: "none" });
                        }}
                        onRevert={() => {
                            setBookData(books ?? [emptyBook]);
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

export default AddBook
