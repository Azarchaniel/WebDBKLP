import React, { memo, useState } from 'react';
import { useQuoteModal } from './useQuoteModal';
import { IQuote } from '../../type';

interface StandaloneQuoteModalProps {
    quote?: IQuote;
    onSave: (quote: IQuote) => void;
    saveResultSuccess?: boolean;
    buttonClassName?: string;
    buttonText?: string;
}

/**
 * StandaloneQuoteModal - A component wrapper around the useQuoteModal hook
 * for easy inclusion of a persistent quote modal anywhere in the app
 * 
 * Performance optimized with React.memo to prevent unnecessary re-renders
 */
const StandaloneQuoteModal: React.FC<StandaloneQuoteModalProps> = memo(({
    quote,
    onSave,
    saveResultSuccess,
    buttonClassName = "btn btn-primary",
    buttonText
}) => {
    const { openQuoteModal } = useQuoteModal();
    // Using state to avoid re-renders from parent component
    const [modalOpened, setModalOpened] = useState(false);

    const handleOpenModal = () => {
        if (modalOpened) return;

        setModalOpened(true);
        const { closeModal } = openQuoteModal(
            quote,
            (formData) => {
                onSave(formData);
                // Wrap in requestAnimationFrame to ensure UI updates are batched efficiently
                requestAnimationFrame(() => {
                    setModalOpened(false);
                });
            },
            saveResultSuccess
        );

        // Reset state when modal is closed
        return () => {
            setModalOpened(false);
            closeModal();
        };
    };

    return (
        <button
            type="button"
            className={buttonClassName}
            onClick={handleOpenModal}
        >
            {buttonText || (quote ? 'Edit Quote' : 'Add Quote')}
        </button>
    );
});

export default StandaloneQuoteModal;