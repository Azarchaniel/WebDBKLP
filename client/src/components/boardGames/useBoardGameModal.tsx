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

        // Handler for form changes
        const handleChange = (data: IBoardGame[] | object) => {
            formData = data;
        };

        // Handler for form validation errors
        const handleError = (errors: ValidationError[] | undefined) => {
            validationErrors = errors;
        };

        // Handler for saving the board game
        const handleSave = () => {
            onSave(formData);
        };

        // Handler for clearing the form
        const handleClear = () => {
            // Reset to empty board game
            formData = [{}];

            // Re-render the modal with updated data
            showModal({
                customKey: modalKey,
                title: boardGames.length > 0 && boardGames[0]._id ? 'Uprav spoločenskú hru' : 'Pridaj spoločenskú hru',
                body: (
                    <BoardGamesModalBody
                        data={[{}] as IBoardGame[]}
                        onChange={handleChange}
                        error={handleError}
                    />
                ),
                footer: (
                    <ModalButtons
                        onSave={handleSave}
                        onClear={handleClear}
                        onRevert={() => {
                            formData = boardGames;
                            showModal({
                                customKey: modalKey,
                                title: boardGames.length > 0 && boardGames[0]._id ? 'Uprav spoločenskú hru' : 'Pridaj spoločenskú hru',
                                body: (
                                    <BoardGamesModalBody
                                        data={boardGames}
                                        onChange={handleChange}
                                        error={handleError}
                                    />
                                ),
                                footer: (
                                    <ModalButtons
                                        onSave={handleSave}
                                        onClear={handleClear}
                                        onRevert={() => { }}
                                        error={validationErrors}
                                        saveResultSuccess={saveResultSuccess}
                                    />
                                )
                            });
                        }}
                        error={validationErrors}
                        saveResultSuccess={saveResultSuccess}
                    />
                )
            });
        };

        // Open the modal
        showModal({
            customKey: modalKey,
            title: boardGames.length > 0 && boardGames[0]._id ? 'Uprav spoločenskú hru' : 'Pridaj spoločenskú hru',
            body: (
                <BoardGamesModalBody
                    data={boardGames}
                    onChange={handleChange}
                    error={handleError}
                />
            ),
            footer: (
                <ModalButtons
                    onSave={handleSave}
                    onClear={handleClear}
                    onRevert={() => {
                        formData = boardGames;
                        showModal({
                            customKey: modalKey,
                            title: boardGames.length > 0 && boardGames[0]._id ? 'Uprav spoločenskú hru' : 'Pridaj spoločenskú hru',
                            body: (
                                <BoardGamesModalBody
                                    data={boardGames}
                                    onChange={handleChange}
                                    error={handleError}
                                />
                            ),
                            footer: (
                                <ModalButtons
                                    onSave={handleSave}
                                    onClear={handleClear}
                                    onRevert={() => { }}
                                    error={validationErrors}
                                    saveResultSuccess={saveResultSuccess}
                                />
                            )
                        });
                    }}
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

    return { openBoardGameModal };
};