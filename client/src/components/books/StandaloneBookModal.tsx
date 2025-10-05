import React, { useState, useEffect, useCallback } from 'react';
import { IBook, ValidationError } from '../../type';
import { Modal, ModalButtons } from '@components/Modal';
import { BooksModalBody } from './BookModal';
import { emptyBook } from '@utils';
import { toast } from 'react-toastify';
import { addBook } from '../../API';

interface BookModalProps {
    /**
     * Books to edit (undefined or empty array for new book)
     */
    books?: IBook[];

    /**
     * Called when the modal is closed
     */
    onClose?: () => void;

    /**
     * Called after a successful save
     * @param savedBooks The books that were saved
     */
    onSaveSuccess?: (savedBooks: IBook[]) => void;

    /**
     * Whether the modal is initially visible
     */
    initiallyVisible?: boolean;

    /**
     * Custom title for the modal (defaults to "Edit Book" or "Add Book")
     */
    title?: string;

    /**
     * Indicates the success state of the save operation
     */
    saveResultSuccess?: boolean | undefined;
}

/**
 * A standalone book modal component that manages its own state
 */
export const StandaloneBookModal: React.FC<BookModalProps> = ({
    books,
    onClose,
    onSaveSuccess,
    initiallyVisible = false,
    title
}) => {
    const [visible, setVisible] = useState<boolean>(initiallyVisible || Boolean(books));
    const [bookData, setBookData] = useState<IBook[]>(books || [emptyBook]);
    const [saveResultSuccess, setSaveResultSuccess] = useState<boolean | undefined>(undefined);
    const [error, setError] = useState<ValidationError[] | undefined>([{
        label: "Názov knihy musí obsahovať aspoň jeden znak!",
        target: "title"
    }]);
    const [outline, setOutline] = useState<React.CSSProperties>();

    // Reset form data when books prop changes
    useEffect(() => {
        if (books) {
            setBookData(books);
        }
    }, [books]);

    // Update outline based on save result
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

    // Handle book data changes from the form
    const handleChange = useCallback((data: IBook | object | IBook[]) => {
        // If data is an array of IBook, set directly; otherwise, wrap in array
        if (Array.isArray(data)) {
            setBookData(data as IBook[]);
        } else if (typeof data === "object") {
            setBookData([data as IBook]);
        } else {
            setBookData([emptyBook]);
        }
    }, []);

    // Handle saving the book
    const handleSave = useCallback(() => {
        setSaveResultSuccess(undefined);

        addBook(bookData)
            .then((res) => {
                if (Array.isArray(bookData) && bookData.length > 1) {
                    let message = "";
                    if (res.length < 5) {
                        message = `${res.length} knihy boli úspešne upravené.`;
                    } else {
                        message = `${res.length} kníh bolo úspešne upravených.`;
                    }

                    toast.success(message);
                } else {
                    toast.success(
                        `Kniha ${Array.isArray(res) ?
                            res[0].data.book?.title :
                            res.data.book?.title
                        } bola úspešne ${(bookData[0] as IBook)._id ? "uložená" : "pridaná"}.`);
                }
                setSaveResultSuccess(true);

                // Notify parent component of successful save
                if (onSaveSuccess) {
                    const savedBooks = Array.isArray(res)
                        ? res.map(r => r.data.book)
                        : [res.data.book];
                    onSaveSuccess(savedBooks);
                }

                // Close modal after successful save (optional)
                // setTimeout(() => setVisible(false), 1500);
            })
            .catch((err) => {
                toast.error(err.response?.data?.error || "Chyba! Kniha nebola uložená!");
                console.trace("Error saving books", err)
                setSaveResultSuccess(false);
            });
    }, [bookData, onSaveSuccess]);

    // Handle clearing the form
    const handleClear = useCallback(() => {
        setBookData([emptyBook]);
        setSaveResultSuccess(undefined);
        setOutline({ outline: "none" });
    }, []);

    // Handle reverting changes
    const handleRevert = useCallback(() => {
        setBookData(books || [emptyBook]);
        setSaveResultSuccess(undefined);
        setOutline({ outline: "none" });
    }, [books]);

    // Handle closing the modal
    const handleClose = useCallback(() => {
        setVisible(false);
        if (onClose) onClose();
    }, [onClose]);

    // Show modal button if it's not initially visible
    const modalButton = (
        <button
            type="button"
            className="addBtnTable"
            onClick={() => setVisible(true)}
            title={title || "Pridať knihu"}
        />
    );

    // Determine the modal title
    const modalTitle = title || (
        (books && books.length > 0 && books[0]._id)
            ? "Upraviť knihu"
            : "Pridať knihu"
    );

    return (
        <>
            {/* Show button only if modal is not automatically visible */}
            {!initiallyVisible && !visible && modalButton}

            {/* Modal */}
            {visible && (
                <Modal
                    customKey={bookData[0]?._id || "new-book"}
                    title={modalTitle}
                    onClose={handleClose}
                    body={
                        <BooksModalBody
                            data={bookData}
                            onChange={handleChange}
                            error={setError}
                        />
                    }
                    footer={
                        <ModalButtons
                            onSave={handleSave}
                            onClear={handleClear}
                            onRevert={handleRevert}
                            error={error}
                            saveResultSuccess={saveResultSuccess}
                        />
                    }
                    overrideStyle={outline}
                />
            )}
        </>
    );
};

/**
 * Hook to use the BookModal component programmatically
 */
export const useStandaloneBookModal = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentBooks, setCurrentBooks] = useState<IBook[]>([emptyBook]);

    const openModal = useCallback((books?: IBook[]) => {
        if (books) {
            setCurrentBooks(books);
        } else {
            setCurrentBooks([emptyBook]);
        }
        setIsVisible(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsVisible(false);
    }, []);

    // Render function to be used in your component
    const renderBookModal = useCallback((props: Omit<BookModalProps, 'initiallyVisible' | 'books'> = {}) => (
        <StandaloneBookModal
            {...props}
            initiallyVisible={isVisible}
            books={currentBooks}
            onClose={() => {
                closeModal();
                if (props.onClose) props.onClose();
            }}
        />
    ), [isVisible, currentBooks]);

    return {
        openModal,
        closeModal,
        renderBookModal
    };
};

export default StandaloneBookModal;