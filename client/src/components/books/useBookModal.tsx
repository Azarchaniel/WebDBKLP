import { useModal } from '@utils/context/ModalContext';
import { IBook, ValidationError } from '../../type';
import { ModalButtons } from '../Modal';
import { BooksModalBody } from './BookModal';
import { emptyBook } from '@utils';

/**
 * Custom hook for managing Book modals with persistence across navigation
 */
export const useBookModal = () => {
    const { showModal, hideModal } = useModal();

    /**
     * Open a modal to add a new book or edit existing books
     * @param books Books to edit (or empty array for new book)
     * @param onSave Callback when the book is saved
     * @param saveResultSuccess Optional success state to display
     */
    const openBookModal = (
        books: IBook[],
        onSave: (formData: IBook | IBook[] | object) => Promise<any>,
        saveResultSuccess?: boolean
    ) => {
        // Generate a unique key for this modal instance
        const modalKey = books.length > 0 && books[0]._id
            ? `edit-book-${books[0]._id}`
            : `add-book-${Date.now()}`;
        const isEdit = books.length > 0 && Boolean(books[0]?._id);

        // Internal mutable container for form data and validation (kept outside React state – updates trigger manual re-showModal)
        // Initialize with original books (if any) so that an immediate save without edits preserves original data.
        let formData: IBook[] | IBook | object = books && books.length ? books : [emptyBook];
        let validationErrors: ValidationError[] | undefined = undefined;
        // Version to force remount of body component when clearing/reverting
        let bodyVersion = 0;

        const getTitle = () => isEdit ? 'Úprava knihy' : 'Pridanie knihy';

        // Helper to (re)render the modal with provided data
        const renderModal = (data: IBook[] | IBook | object, forceRemount: boolean = false) => {
            if (forceRemount) bodyVersion += 1;
            const dataArray = Array.isArray(data) ? data : [data as IBook];

            showModal({
                customKey: modalKey,
                title: getTitle(),
                body: (
                    <BooksModalBody
                        key={`book-body-${modalKey}-${bodyVersion}`}
                        data={dataArray}
                        onChange={handleChange}
                        error={handleError}
                    />
                ),
                footer: (
                    <ModalButtons
                        onSave={handleSave}
                        onClear={handleClear}
                        onRevert={handleRevert}
                        error={validationErrors}
                        saveResultSuccess={saveResultSuccess}
                    />
                )
            });
        };

        // Handler for form changes
        const handleChange = (data: IBook | IBook[] | object) => {
            formData = data;
        };

        // Handler for form validation errors
        const handleError = (errors: ValidationError[] | undefined) => {
            validationErrors = errors;
            renderModal(formData);
        };

        // Handler for saving the book
        const handleSave = () => {
            // Forward the promise so ModalButtons can manage spinner lifecycle
            return onSave(formData);
        };

        // Handler to clear all inputs in the form
        const handleClear = () => {
            const currentArray: IBook[] = Array.isArray(formData)
                ? (formData as IBook[])
                : [(formData as IBook)];

            const clearedArray: IBook[] = currentArray.map(() => ({ ...emptyBook } as IBook));

            formData = clearedArray;
            validationErrors = undefined;
            renderModal(clearedArray, true);
        };

        // Handler to revert form to the original object(s)
        const handleRevert = () => {
            const originalArray: IBook[] = (books && books.length ? books : [emptyBook]) as IBook[];

            // Deep copy to decouple from any references
            const revertedArray: IBook[] = JSON.parse(JSON.stringify(originalArray));

            formData = revertedArray;
            validationErrors = undefined;
            renderModal(revertedArray, true);
        };

        // Open the modal
        renderModal(books && books.length ? books : [emptyBook]);

        // Return a method to close the modal
        return {
            closeModal: () => hideModal(modalKey)
        };
    };

    return { openBookModal };
};