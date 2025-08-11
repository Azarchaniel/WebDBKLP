import React, { useEffect, useState } from "react";
import { IBoardGame, ValidationError } from "../../type";
import { Modal } from "@components/Modal";
import { BoardGamesModalBody } from "@components/boardGames/BoardGamesModal";
import { ModalButtons } from "@components/Modal";

interface Props {
    saveBoardGame: (formData: IBoardGame[] | object) => void;
    onClose: () => void;
    boardGame?: IBoardGame[];
    saveResultSuccess?: boolean;
}

const AddBoardGame: React.FC<Props> = ({ saveBoardGame, boardGame, onClose, saveResultSuccess }: Props) => {
    const [showModal, setShowModal] = useState(Boolean(boardGame));
    const [boardGameData, setBoardGameData] = useState<IBoardGame[] | undefined>(boardGame);
    const [error, setError] = useState<ValidationError[] | undefined>([{
        label: "The title of the board game must contain at least one character!",
        target: "title"
    }]);
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
                    customKey={boardGame?.[0]._id || "new"}
                    title={(boardGame ? "Uprav" : "Pridaj") + " spoločenskú hru"}
                    onClose={() => {
                        setShowModal(false);
                        onClose();
                    }}
                    body={
                        <BoardGamesModalBody
                            data={boardGameData as IBoardGame[]}
                            onChange={(data: IBoardGame[] | object) => {
                                if (Array.isArray(data)) {
                                    setBoardGameData(data as IBoardGame[]);
                                } else if (typeof data === "object") {
                                    setBoardGameData([data as IBoardGame]);
                                } else {
                                    setBoardGameData(undefined);
                                }
                            }}
                            error={setError}
                        />
                    }
                    footer={
                        <ModalButtons
                            onSave={() => saveBoardGame(boardGameData as IBoardGame[])}
                            onClear={() => {
                                setBoardGameData([{} as IBoardGame]);
                                setOutline({ outline: "none" });
                            }}
                            onRevert={() => {
                                setBoardGameData(boardGame ?? [{} as IBoardGame]);
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
