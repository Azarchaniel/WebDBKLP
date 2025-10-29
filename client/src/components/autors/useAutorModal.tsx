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
        let formData: IAutor[] | object = autors || [];
        let validationErrors: ValidationError[] | undefined = undefined;

        const getTitle = () => autors.length > 0 && autors[0]._id ? 'Úprava autora' : 'Pridanie autora';

        // Helper to render the modal with given data
        const renderModal = (data: IAutor[] | object) => {
            const dataArray = Array.isArray(data) ? data : [data as IAutor];

            showModal({
                customKey: modalKey,
                title: getTitle(),
                body: (
                    <AutorsModalBody
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
        const handleChange = (data: IAutor[] | object) => {
            formData = data;
        };

        // Handler for form validation errors
        const handleError = (errors: ValidationError[] | undefined) => {
            validationErrors = errors;
            renderModal(formData);
        };

        // Handler for saving the autor
        const handleSave = () => {
            return onSave(formData);
        };

        // Handler for clearing the form
        const handleClear = () => {
            formData = [{}] as IAutor[];
            validationErrors = undefined;
            renderModal(formData);
        };

        // Handler for reverting changes
        const handleRevert = () => {
            formData = autors;
            validationErrors = undefined;
            renderModal(autors);
        };

        // Open the modal
        renderModal(autors);

        // Return a method to close the modal
        return {
            closeModal: () => hideModal(modalKey)
        };
    };

    return { openAutorModal };
};