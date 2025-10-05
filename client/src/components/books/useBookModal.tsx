import React from 'react';
import { useModal } from '@utils/context/ModalContext';
import { IBook, ValidationError } from '../../type';
import { ModalButtons } from '../Modal';
import { BooksModalBody } from './BookModal';

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
        onSave: (formData: IBook | IBook[] | object) => void,
        saveResultSuccess?: boolean
    ) => {
        // Generate a unique key for this modal instance
        const modalKey = books.length > 0 && books[0]._id
            ? `edit-book-${books[0]._id}`
            : `add-book-${Date.now()}`;

        // Internal state for form data and validation
        let formData: IBook | IBook[] | object = [];
        let validationErrors: ValidationError[] | undefined = undefined;

        // Handler for form changes
        const handleChange = (data: IBook | IBook[] | object) => {
            formData = data;
        };

        // Handler for form validation errors
        const handleError = (errors: ValidationError[] | undefined) => {
            validationErrors = errors;
        };

        // Handler for saving the book
        const handleSave = () => {
            onSave(formData);
        };

        // Handler for clearing the form
        const handleClear = () => {
            // Reset to empty book
            formData = [];

            // Re-render the modal with updated data
            showModal({
                customKey: modalKey,
                title: books.length > 0 && books[0]._id ? 'Úprava knihy' : 'Pridanie knihy',
                body: (
                    <BooksModalBody
                        data={[]}
                        onChange={handleChange}
                        error={handleError}
                    />
                ),
                footer: (
                    <ModalButtons
                        onSave={handleSave}
                        onClear={handleClear}
                        error={validationErrors}
                        saveResultSuccess={saveResultSuccess}
                    />
                )
            });
        };

        // Open the modal
        showModal({
            customKey: modalKey,
            title: books.length > 0 && books[0]._id ? 'Úprava knihy' : 'Pridanie knihy',
            body: (
                <BooksModalBody
                    data={books}
                    onChange={handleChange}
                    error={handleError}
                />
            ),
            footer: (
                <ModalButtons
                    onSave={handleSave}
                    onClear={handleClear}
                    error={validationErrors}
                    saveResultSuccess={saveResultSuccess}
                />
            )
        });

        // Return a method to close the modal
        return {
            closeModal: () => hideModal(modalKey)
        };
    };

    return { openBookModal };
};