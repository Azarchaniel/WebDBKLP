import React, { useCallback, useMemo } from 'react';
import { useModal } from '@utils/context/ModalContext';
import { IQuote, ValidationError } from '../../type';
import { ModalButtons } from '../Modal';
import { QuotesModalBody } from './QuotesModal';

/**
 * Custom hook for managing Quote modals with persistence across navigation
 */
export const useQuoteModal = () => {
    const { showModal, hideModal } = useModal();

    /**
     * Open a modal to add a new quote or edit existing quotes
     * @param quote Quote to edit (or empty object for new quote)
     * @param onSave Callback when the quote is saved
     * @param saveResultSuccess Optional success state to display
     */
    const openQuoteModal = (
        quote: IQuote | undefined,
        onSave: (formData: IQuote) => void,
        saveResultSuccess?: boolean
    ) => {
        // Generate a unique key for this modal instance
        const modalKey = quote?._id
            ? `edit-quote-${quote._id}`
            : `add-quote-${Date.now()}`;

        // Internal state for form data and validation
        let formData: IQuote | object = quote || {};
        let validationErrors: ValidationError[] | undefined = undefined;

        // Handler for form changes
        const handleChange = (data: IQuote | object) => {
            formData = data;
        };

        // Handler for form validation errors
        const handleError = (errors: ValidationError[] | undefined) => {
            validationErrors = errors;
        };

        // Handler for saving the quote - wrapped in requestAnimationFrame for better performance
        const handleSave = () => {
            // Use requestAnimationFrame to ensure UI updates are batched efficiently
            requestAnimationFrame(() => {
                onSave(formData as IQuote);
            });
        };

        // Handler for clearing the form
        const handleClear = () => {
            // Reset to empty quote
            formData = {};

            // Re-render the modal with updated data - use requestAnimationFrame for smoother updates
            requestAnimationFrame(() => {
                showModal({
                    customKey: modalKey,
                    title: quote?._id ? 'Uprav citát' : 'Pridaj citát',
                    body: (
                        <QuotesModalBody
                            data={{}}
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
            });
        };

        // Create optimized components for body and footer
        const ModalBodyComponent = React.memo(function ModalBody() {
            return (
                <QuotesModalBody
                    data={formData as IQuote}
                    onChange={handleChange}
                    error={handleError}
                />
            );
        });

        const ModalFooterComponent = React.memo(function ModalFooter() {
            return (
                <ModalButtons
                    onSave={handleSave}
                    onClear={handleClear}
                    error={validationErrors}
                    saveResultSuccess={saveResultSuccess}
                />
            );
        });

        // Open the modal - wrapped in requestAnimationFrame for smoother rendering
        requestAnimationFrame(() => {
            showModal({
                customKey: modalKey,
                title: quote?._id ? 'Uprav citát' : 'Pridaj citát',
                body: <ModalBodyComponent />,
                footer: <ModalFooterComponent />
            });
        });

        // Return a method to close the modal
        return {
            closeModal: () => hideModal(modalKey)
        };
    };

    return { openQuoteModal };
};