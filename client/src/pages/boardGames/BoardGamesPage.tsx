import React, { useEffect, useRef, useState } from "react";
import { IBoardGame, IBookColumnVisibility } from "../../type";
import { getBoardGames, addBoardGame, deleteBoardGame, getBoardGame, countBGchildren } from "../../API";
import { toast } from "react-toastify";
import {
    DEFAULT_PAGINATION,
    getBoardGameTableColumns,
    ShowHideColumns,
    isMobile, stringifyAutors
} from "@utils";
import { openConfirmDialog } from "@components/ConfirmDialog";
import ServerPaginationTable from "../../components/table/TableSP";
import { SortingState } from "@tanstack/react-table";
import { useClickOutside } from "@hooks";
import { useAuth } from "@utils/context";
import AddBoardGame from "./AddBoardGame";
import "@styles/BoardGamesPage.scss";
import { InputField } from "@components/inputs";
import BoardGameDetail from "./BoardGameDetail";
import { useBoardGameModal } from "@components/boardGames/useBoardGameModal";

export default function BoardGamesPage() {
    const { isLoggedIn } = useAuth();
    const [boardGames, setBoardGames] = useState([]);
    const [countAll, setCountAll] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [updateBoardGame, setUpdateBoardGame] = useState<any>();
    const [pagination, setPagination] = useState({
        ...DEFAULT_PAGINATION,
        sorting: [{ id: "title", desc: false }] as SortingState
    });
    const { openBoardGameModal } = useBoardGameModal();
    const [saveBoardGameSuccess, setSaveBoardGameSuccess] = useState<boolean | undefined>(undefined);
    const [showColumn, setShowColumn] = useState<IBookColumnVisibility>({
        control: false,
        title: true,
        description: !isMobile(),
        yearPublished: !isMobile(),
        minPlayers: !isMobile(),
        maxPlayers: !isMobile(),
        playTime: !isMobile(),
        ageRecommendation: !isMobile(),
        publisher: !isMobile(),
        autor: !isMobile(),
        createdAt: false,
        updatedAt: !isMobile(),
    });
    const [selectedBoardGames, setSelectedBoardGames] = useState<string[]>([]);
    const popRef = useRef<HTMLDivElement>(null);
    const exceptRef = useRef<HTMLDivElement>(null);

    useClickOutside(popRef, () => {
        setShowColumn(prevState => ({
            ...prevState,
            control: false
        }));
    }, exceptRef);

    useEffect(() => {
        fetchBoardGames();
    }, [pagination]);

    const fetchBoardGames = (): void => {
        setLoading(true);
        getBoardGames(pagination)
            .then(({ data: { boardGames, count } }: any) => {
                setCountAll(count);
                setBoardGames(stringifyAutors(boardGames));
            })
            .catch((err: Error) => console.trace(err))
            .finally(() => setLoading(false));
    };

    const handleSaveBoardGame = (formData: IBoardGame | IBoardGame[] | object): void => {
        setSaveBoardGameSuccess(undefined);

        addBoardGame(formData)
            .then(({ status }) => {
                if (status !== 201) {
                    // Handle error based on whether it's a single game or multiple games
                    if (Array.isArray(formData)) {
                        toast.error(`Chyba! Spoločenské hry neboli upravené.`);
                    } else {
                        toast.error(`Chyba! Spoločenská hra ${(formData as IBoardGame)?.title || ''} nebola ${(formData as IBoardGame)._id ? "upravená" : "pridaná"}.`);
                    }
                    throw new Error("Error! Board game was not added/updated!");
                }

                // Handle success messages
                if (Array.isArray(formData)) {
                    const count = formData.length;
                    if (count === 1) {
                        // Single game in array
                        toast.success(`Spoločenská hra ${formData[0]?.title || ''} bola úspešne ${formData[0]._id ? "upravená" : "pridaná"}.`);
                    } else {
                        // Multiple games
                        toast.success(
                            count < 5
                                ? `${count} spoločenské hry boli úspešne upravené.`
                                : `${count} spoločenských hier bolo úspešne upravených.`
                        );
                    }
                } else {
                    // Single game object
                    toast.success(`Spoločenská hra ${(formData as IBoardGame)?.title || ''} bola úspešne ${(formData as IBoardGame)._id ? "upravená" : "pridaná"}.`);
                }

                setSaveBoardGameSuccess(true);
                fetchBoardGames();
            })
            .catch((err) => {
                // Handle specific API errors if they exist
                if (err.response?.data?.error) {
                    toast.error(err.response.data.error);
                }
                console.trace(err);
                setSaveBoardGameSuccess(false);
            });
    };

    const handleUpdateBoardGame = (_id?: string): void => {
        setSaveBoardGameSuccess(undefined);

        if (_id) {
            const boardGameToUpdate = boardGames.find((boardGame: any) => boardGame._id === _id);

            if (boardGameToUpdate) {
                // Use the persistent modal for a single board game
                openBoardGameModal(
                    [boardGameToUpdate],
                    handleSaveBoardGame,
                    saveBoardGameSuccess
                );
            } else {
                getBoardGame(_id)
                    .then(({ data }) => {
                        if (data.boardGame) {
                            // Use the persistent modal for fetched board game
                            openBoardGameModal(
                                [data.boardGame],
                                handleSaveBoardGame,
                                saveBoardGameSuccess
                            );
                        }
                    })
                    .catch((err) => {
                        toast.error(err.response?.data?.error || "Chyba! Spoločenská hra nebola nájdená!");
                        console.trace(err);
                    });
            }
        }

        // Handle multi-edit for selected board games
        if (selectedBoardGames.length > 0) {
            const selectedBoardGamesData = boardGames.filter((game: IBoardGame) =>
                selectedBoardGames.includes(game._id));

            // Use the persistent modal for multiple selected board games
            openBoardGameModal(
                selectedBoardGamesData,
                handleSaveBoardGame,
                saveBoardGameSuccess
            );
        }
    };

    const handleDeleteBoardGame = async (_id?: string): Promise<void> => {
        // If multiple board games are selected, delete all selected
        const idsToDelete = selectedBoardGames.length > 0 ? selectedBoardGames : [_id];

        if (idsToDelete.length === 0) return;

        // Get board game objects for confirmation dialog
        const boardGamesToDelete = boardGames.filter((game: IBoardGame) => idsToDelete.includes(game._id));

        const proceedDelete = async (games: IBoardGame[]) => {
            // Check for expansions for all selected games
            const expansionsPromises = games.map(game => countBGchildren(game._id));
            const expansionsResults = await Promise.all(expansionsPromises);

            const totalExpansions = expansionsResults.reduce((sum, result) => sum + result.data.count, 0);

            let warningText = "";
            if (totalExpansions === 1) {
                warningText = "Vybraná hra má k sebe priradené 1 rozšírenie!";
            } else if (totalExpansions > 1 && totalExpansions < 5) {
                warningText = `Vybrané hry majú k sebe priradené ${totalExpansions} rozšírenia!`;
            } else if (totalExpansions >= 5) {
                warningText = `Vybrané hry majú k sebe priradených ${totalExpansions} rozšírení!`;
            }

            const titles = games.map(g => g.title).join("\n ");

            let message = "";
            if (games.length > 1 && games.length < 5) {
                message = `Naozaj chceš vymazať ${games.length} hry:\n\n ${titles}?`;
            } else if (games.length >= 5) {
                message = `Naozaj chceš vymazať ${games.length} hier:\n\n ${titles}?`;
            } else {
                message = `Naozaj chceš vymazať hru ${titles}?`;
            }

            if (totalExpansions > 0) {
                message += `\n\n${warningText}`;
            }

            openConfirmDialog({
                text: message,
                title: games.length > 1 ? "Vymazať spoločenské hry?" : "Vymazať spoločenskú hru?",
                onOk: () => {
                    Promise.all(idsToDelete.filter((id): id is string => typeof id === "string" && id !== undefined).map(id => deleteBoardGame(id)))
                        .then((results) => {
                            const successCount = results.filter(r => r.status === 200).length;
                            if (successCount === 0) throw new Error("Error! Board games not deleted");
                            toast.success(
                                successCount > 1
                                    ? `${successCount} ${successCount < 5 ? 'hry boli' : 'hier bolo'} úspešne vymazaných.`
                                    : `Hra ${games[0].title} bola úspešne vymazaná.`
                            );
                            fetchBoardGames();
                        })
                        .catch((err) => {
                            toast.error(err.response?.data?.error || "Chyba pri mazaní hier!");
                            console.trace(err);
                        });
                },
                onCancel: () => { }
            });
        };

        if (boardGamesToDelete.length === idsToDelete.length) {
            proceedDelete(boardGamesToDelete);
        } else {
            // Some board games not in local state, fetch them
            Promise.all(idsToDelete.filter(id => typeof id === "string").map(id => {
                const localGame = boardGames.find((game: IBoardGame) => game._id === id);
                return localGame
                    ? Promise.resolve(localGame)
                    : id ? getBoardGame(id).then(({ data }) => data.boardGame) : Promise.resolve(undefined);
            }))
                .then((games) => proceedDelete(games.filter(Boolean)))
                .catch((err) => {
                    toast.error(err.response?.data?.error || "Chyba pri načítaní hier!");
                    console.trace(err);
                });
        }
    };

    const handlePageSizeChange = (newPageSize: number) => {
        const newPage = Math.floor(((pagination.page - 1) * pagination.pageSize) / newPageSize) + 1;
        setPagination(prevState => ({ ...prevState, page: newPage, pageSize: newPageSize }));
    };

    // Handle the add board game button click
    const handleAddBoardGame = () => {
        setSaveBoardGameSuccess(undefined);
        openBoardGameModal([] as IBoardGame[], handleSaveBoardGame, saveBoardGameSuccess);
    };

    return (
        <>
            {isLoggedIn &&
                <button type="button" className="addBtnTable" onClick={handleAddBoardGame} />
            }
            <div ref={popRef} className={`showHideColumns ${showColumn.control ? "shown" : "hidden"}`}>
                <ShowHideColumns columns={getBoardGameTableColumns()} shown={showColumn} setShown={setShowColumn} />
            </div>
            <ServerPaginationTable
                title={`Spoločenské hry (${countAll})`}
                data={boardGames}
                columns={getBoardGameTableColumns()}
                pageChange={(page) => setPagination(prevState => ({ ...prevState, page: page }))}
                pageSizeChange={handlePageSizeChange}
                sortingChange={(sorting) => setPagination(prevState => ({ ...prevState, sorting: sorting }))}
                totalCount={countAll}
                loading={loading}
                pagination={pagination}
                hiddenCols={showColumn}
                actions={
                    <div className="tableActionsRight">
                        <div className="searchTableWrapper">
                            <InputField
                                className="form-control"
                                style={{ paddingRight: "2rem" }}
                                placeholder="Vyhľadaj hru"
                                value={pagination.search}
                                onChange={(e) =>
                                    setPagination(prevState => ({
                                        ...prevState,
                                        page: DEFAULT_PAGINATION.page,
                                        search: e.target.value
                                    }))
                                }
                            />
                            <div className="searchBtns">
                                <button onClick={() => setPagination(prevState => ({
                                    ...prevState,
                                    page: DEFAULT_PAGINATION.page,
                                    search: ""
                                }))}>✖
                                </button>
                            </div>
                        </div>
                        <i
                            ref={exceptRef}
                            className="fas fa-bars bookTableAction ml-4"
                            title="Zobraz/skry stĺpce"
                            onClick={() => setShowColumn({ ...showColumn, control: !showColumn.control })}
                        />
                    </div>
                }
                rowActions={isLoggedIn ? (_id, expandRow) => (
                    <div className="actionsRow" style={{ pointerEvents: "auto" }}>
                        <button
                            title="Vymazať"
                            onClick={() => handleDeleteBoardGame(_id)}
                            className="fa fa-trash"
                        />
                        <button
                            title="Upraviť"
                            className="fa fa-pencil-alt"
                            onClick={() => handleUpdateBoardGame(_id)}
                        />
                        <button
                            key={`detail-${_id}`}
                            title="Detaily"
                            className="fa fa-chevron-down"
                            onClick={() => expandRow()}
                        />
                    </div>
                ) : undefined}
                expandedElement={(data) => <BoardGameDetail data={data} />}
                selectedChanged={(ids) => setSelectedBoardGames(ids)}
            />
        </>
    );
}
