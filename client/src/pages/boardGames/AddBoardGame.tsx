import React, { useEffect, useState } from "react";
import { IBoardGame, SaveEntity } from "../../type";
import { useBoardGameModal } from "@components/boardGames/useBoardGameModal";

interface Props {
    saveBoardGame: (formData: SaveEntity<IBoardGame>) => void;
    boardGame?: IBoardGame[];
    saveResultSuccess?: boolean;
}

const AddBoardGame: React.FC<Props> = ({ saveBoardGame, boardGame, saveResultSuccess }: Props) => {
    const { openBoardGameModal } = useBoardGameModal();
    const [showButton, setShowButton] = useState<boolean>(true);

    // Handle immediate display if a boardGame is provided
    useEffect(() => {
        if (boardGame && boardGame.length > 0) {
            handleOpenModal();
        }
    }, [boardGame]);

    const handleOpenModal = () => {
        const { closeModal } = openBoardGameModal(
            boardGame || [],
            (formData) => {
                saveBoardGame(formData);
            },
            saveResultSuccess
        );
        return closeModal;
    };

    return (
        <>
            {showButton && (
                <button
                    type="button"
                    className="addBtnTable"
                    onClick={handleOpenModal}
                />
            )}
        </>
    );
};

export default AddBoardGame;
