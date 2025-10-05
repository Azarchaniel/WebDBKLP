import React, { ReactElement } from 'react';
import { useModal } from '@utils/context/ModalContext';

interface UseModalDialogProps {
    key: string;
    title: string;
    body: ReactElement;
    footer?: ReactElement;
}

export const useModalDialog = () => {
    const { showModal, hideModal } = useModal();

    const openModal = ({ key, title, body, footer }: UseModalDialogProps) => {
        showModal({
            customKey: key,
            title,
            body,
            footer
        });
    };

    const closeModal = (key: string) => {
        hideModal(key);
    };

    return { openModal, closeModal };
};