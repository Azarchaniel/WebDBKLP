import React from 'react';
import { useModal } from '@utils/context/ModalContext';
import { IBoardGame, ValidationError } from '../../type';
import { ModalButtons } from '../Modal';
import { BoardGamesModalBody } from './BoardGamesModal';

/**
 * Custom hook for managing BoardGame modals with persistence across navigation
 */
export const useBoardGameModal = () => {
    const { showModal, hideModal } = useModal();

    /**
     * Open a modal to add a new board game or edit existing board games
     * @param boardGames Board games to edit (or empty array for new board game)
     * @param onSave Callback when the board game is saved
     * @param saveResultSuccess Optional success state to display
     */
    const openBoardGameModal = (
        boardGames: IBoardGame[],
        onSave: (formData: IBoardGame[] | object) => void,
        saveResultSuccess?: boolean
    ) => {
        // Generate a unique key for this modal instance
        const modalKey = boardGames.length > 0 && boardGames[0]._id
            ? `edit-boardgame-${boardGames[0]._id}`
            : `add-boardgame-${Date.now()}`;

        // Internal state for form data and validation
        let formData: IBoardGame[] | object = boardGames || [];
        let validationErrors: ValidationError[] | undefined = undefined;

        const getTitle = () => boardGames.length > 0 && boardGames[0]._id ? 'Uprav spoločenskú hru' : 'Pridaj spoločenskú hru';

        // Helper to render the modal with given data
        const renderModal = (data: IBoardGame[] | object, includeRevert: boolean = true) => {
            const dataArray = Array.isArray(data) ? data : [data as IBoardGame];

            showModal({
                customKey: modalKey,
                title: getTitle(),
                body: (
                    <BoardGamesModalBody
                        data={dataArray}
                        onChange={handleChange}
                        error={handleError}
                    />
                ),
                footer: (
                    <ModalButtons
                        onSave={handleSave}
                        onClear={handleClear}
                        onRevert={includeRevert ? handleRevert : undefined}
                        error={validationErrors}
                        saveResultSuccess={saveResultSuccess}
                    />
                )
            });
        };

        // Handler for form changes
        const handleChange = (data: IBoardGame[] | object) => {
            formData = data;
        };

        // Handler for form validation errors
        const handleError = (errors: ValidationError[] | undefined) => {
            validationErrors = errors;
            renderModal(formData);
        };

        // Handler for saving the board game
        const handleSave = () => {
            return onSave(formData);
        };

        // Handler for clearing the form
        const handleClear = () => {
            formData = [{}];
            validationErrors = undefined;
            renderModal(formData);
        };

        // Handler for reverting changes
        const handleRevert = () => {
            formData = boardGames;
            validationErrors = undefined;
            renderModal(boardGames);
        };

        // Open the modal
        renderModal(boardGames);

        // Return a method to close the modal
        return {
            closeModal: () => hideModal(modalKey)
        };
    };

    return { openBoardGameModal };
};