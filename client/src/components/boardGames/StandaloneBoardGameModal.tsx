import React from 'react';
import { useBoardGameModal } from './useBoardGameModal';
import { IBoardGame } from '../../type';

interface StandaloneBoardGameModalProps {
    boardGame?: IBoardGame[];
    onSave: (boardGame: IBoardGame[] | object) => void;
    saveResultSuccess?: boolean;
    buttonClassName?: string;
    buttonText?: string;
}

/**
 * StandaloneBoardGameModal - A component wrapper around the useBoardGameModal hook
 * for easy inclusion of a persistent board game modal anywhere in the app
 */
const StandaloneBoardGameModal: React.FC<StandaloneBoardGameModalProps> = ({
    boardGame,
    onSave,
    saveResultSuccess,
    buttonClassName = "btn btn-primary",
    buttonText
}) => {
    const { openBoardGameModal } = useBoardGameModal();

    const handleOpenModal = () => {
        openBoardGameModal(boardGame || [{}] as IBoardGame[], onSave, saveResultSuccess);
    };

    return (
        <button
            type="button"
            className={buttonClassName}
            onClick={handleOpenModal}
        >
            {buttonText || (boardGame && boardGame.length > 0 ? 'Uprav spoločenskú hru' : 'Pridaj spoločenskú hru')}
        </button>
    );
};

export default StandaloneBoardGameModal;