import React from 'react';
import { useModal } from '@utils/context/ModalContext';
import { ILP, ValidationError } from '../../type';
import { ModalButtons } from '../Modal';
import { LPsModalBody } from './LPsModal';

/**
 * Custom hook for managing LP modals with persistence across navigation
 */
export const useLPModal = () => {
    const { showModal, hideModal } = useModal();

    /**
     * Open a modal to add a new LP or edit existing LPs
     * @param lps LPs to edit (or empty array for new LP)
     * @param onSave Callback when the LP is saved
     * @param saveResultSuccess Optional success state to display
     */
    const openLPModal = (
        lps: ILP[],
        onSave: (formData: ILP[] | ILP | object) => void,
        saveResultSuccess?: boolean
    ) => {
        // Generate a unique key for this modal instance
        const modalKey = lps.length > 0 && lps[0]._id
            ? `edit-lp-${lps[0]._id}`
            : `add-lp-${Date.now()}`;

        // Internal state for form data and validation
        let formData: ILP[] | ILP | object = [];
        let validationErrors: ValidationError[] | undefined = undefined;

        // Handler for form changes
        const handleChange = (data: ILP[] | ILP | object) => {
            formData = data;
        };

        // Handler for form validation errors
        const handleError = (errors: ValidationError[] | undefined) => {
            validationErrors = errors;
        };

        // Handler for saving the LP
        const handleSave = () => {
            onSave(formData);
        };

        // Handler for clearing the form
        const handleClear = () => {
            // Reset to empty LP
            formData = [{}] as ILP[];

            // Re-render the modal with updated data
            showModal({
                customKey: modalKey,
                title: lps.length > 0 && lps[0]._id ? 'Úprava LP' : 'Pridanie LP',
                body: (
                    <LPsModalBody
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
                title: lps.length > 0 && lps[0]._id ? 'Úprava LP' : 'Pridanie LP',
                body: (
                    <LPsModalBody
                        data={lps}
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
            title: lps.length > 0 && lps[0]._id ? 'Úprava LP' : 'Pridanie LP',
            body: (
                <LPsModalBody
                    data={lps}
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

    return { openLPModal };
};