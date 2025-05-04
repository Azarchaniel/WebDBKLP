import React, { useEffect, useState } from "react";
import { IBoardGame, ValidationError } from "../../type";
import { Modal } from "@components/Modal";
import { BoardGamesModalBody, BoardGamesModalButtons } from "@components/boardGames/BoardGamesModal";

interface Props {
    saveBoardGame: (formData: IBoardGame) => void;
    onClose: () => void;
    boardGame?: IBoardGame;
    saveResultSuccess?: boolean;
}

const AddBoardGame: React.FC<Props> = ({ saveBoardGame, boardGame, onClose, saveResultSuccess }: Props) => {
    const [showModal, setShowModal] = useState(Boolean(boardGame));
    const [boardGameData, setBoardGameData] = useState<IBoardGame | object>(boardGame || {});
    const [error, setError] = useState<ValidationError[] | undefined>([
        {
            label: "The title of the board game must contain at least one character!",
            target: "title"
        }
    ]);
    const [outline, setOutline] = useState<React.CSSProperties>();

    useEffect(() => {
        switch (saveResultSuccess) {
            case true:
                setOutline({ outline: "10px solid green" });
                break;
            case false:
                setOutline({ outline: "10px solid red" });
                break;
            default:
                setOutline({ outline: "none" });
                break;
        }
    }, [saveResultSuccess]);

    return (
        <>
            <button type="button" className="addBtnTable" onClick={() => setShowModal(true)} />
            {showModal && (
                <Modal
                    customKey={boardGame?._id || "new"}
                    title={(boardGame ? "Uprav" : "Pridaj") + " spoločenskú hru"}
                    onClose={() => {
                        setShowModal(false);
                        onClose();
                    }}
                    body={
                        <BoardGamesModalBody
                            data={boardGameData as IBoardGame}
                            onChange={setBoardGameData}
                            error={setError}
                        />
                    }
                    footer={
                        <BoardGamesModalButtons
                            saveBoardGame={() => saveBoardGame(boardGameData as IBoardGame)}
                            cleanFields={() => {
                                setBoardGameData({});
                                setOutline({ outline: "none" });
                            }}
                            error={error}
                            saveResultSuccess={saveResultSuccess}
                        />
                    }
                    overrideStyle={outline}
                />
            )}
        </>
    );
};

export default AddBoardGame;
