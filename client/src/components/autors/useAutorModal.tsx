import React from 'react';
import { useModal } from '@utils/context/ModalContext';
import { IAutor, ValidationError } from '../../type';
import { ModalButtons } from '../Modal';
import { AutorsModalBody } from './AutorsModal';

/**
 * Custom hook for managing Autor modals with persistence across navigation
 */
export const useAutorModal = () => {
    const { showModal, hideModal } = useModal();

    /**
     * Open a modal to add a new autor or edit existing autors
     * @param autors Autors to edit (or empty array for new autor)
     * @param onSave Callback when the autor is saved
     * @param saveResultSuccess Optional success state to display
     */
    const openAutorModal = (
        autors: IAutor[],
        onSave: (formData: IAutor[] | object) => void,
        saveResultSuccess?: boolean
    ) => {
        // Generate a unique key for this modal instance
        const modalKey = autors.length > 0 && autors[0]._id
            ? `edit-autor-${autors[0]._id}`
            : `add-autor-${Date.now()}`;

        // Internal state for form data and validation
        let formData: IAutor[] | object = [];
        let validationErrors: ValidationError[] | undefined = undefined;

        // Handler for form changes
        const handleChange = (data: IAutor[] | object) => {
            formData = data;
        };

        // Handler for form validation errors
        const handleError = (errors: ValidationError[] | undefined) => {
            validationErrors = errors;
        };

        // Handler for saving the autor
        const handleSave = () => {
            onSave(formData);
        };

        // Handler for clearing the form
        const handleClear = () => {
            // Reset to empty autor
            formData = [{}] as IAutor[];

            // Re-render the modal with updated data
            showModal({
                customKey: modalKey,
                title: autors.length > 0 && autors[0]._id ? 'Úprava autora' : 'Pridanie autora',
                body: (
                    <AutorsModalBody
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

        // Handler for reverting changes
        const handleRevert = () => {
            // Re-render the modal with original data
            showModal({
                customKey: modalKey,
                title: autors.length > 0 && autors[0]._id ? 'Úprava autora' : 'Pridanie autora',
                body: (
                    <AutorsModalBody
                        data={autors}
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

        // Open the modal
        showModal({
            customKey: modalKey,
            title: autors.length > 0 && autors[0]._id ? 'Úprava autora' : 'Pridanie autora',
            body: (
                <AutorsModalBody
                    data={autors}
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

        // Return a method to close the modal
        return {
            closeModal: () => hideModal(modalKey)
        };
    };

    return { openAutorModal };
};