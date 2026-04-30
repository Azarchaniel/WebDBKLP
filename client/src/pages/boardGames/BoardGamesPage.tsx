import React, { useEffect, useRef, useState } from "react";
import { IBoardGame, IBookColumnVisibility, SaveEntity, SaveEntityResult } from "../../type";
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
import { useTranslation } from "react-i18next";

export default function BoardGamesPage() {
    const { t } = useTranslation();
    const { isLoggedIn, isGuest } = useAuth();
    const [boardGames, setBoardGames] = useState([]);
    const [countAll, setCountAll] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
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

    const handleSaveBoardGame = async (formData: SaveEntity<IBoardGame>): Promise<SaveEntityResult> => {
        setSaveBoardGameSuccess(undefined);
        const isNewBoardGame = Array.isArray(formData)
            ? formData.some((bg) => !(bg as IBoardGame)._id)
            : !(formData as IBoardGame)._id;

        if (Array.isArray(formData) && formData.length > 1) {
            // Multi-edit support
            return Promise.all(formData.map(bg => addBoardGame(bg)))
                .then((results) => {
                    const message = t("boardGames.saveManySuccess", { count: results.length });
                    toast.success(message);
                    setSaveBoardGameSuccess(true);
                    fetchBoardGames();
                    return { success: true, message };
                })
                .catch((err) => {
                    setSaveBoardGameSuccess(false);
                    const message = t("boardGames.saveManyError");
                    toast.error(message);
                    console.trace(err);
                    return { success: false, message };
                });
        } else {
            return addBoardGame(Array.isArray(formData) ? formData[0] : (formData as IBoardGame))
                .then(({ status, data }) => {
                    let message = "";
                    if (status !== 201) {
                        message = t("boardGames.saveErrorSingle", {
                            title: data?.title || "",
                            action: !isNewBoardGame ? t("boardGames.actionEdited") : t("boardGames.actionAdded")
                        });
                        toast.error(message);
                        setSaveBoardGameSuccess(false);
                        return { success: false, message };
                    }
                    message = t("boardGames.saveSuccessSingle", {
                        title: data?.title || "",
                        action: !isNewBoardGame ? t("boardGames.actionEdited") : t("boardGames.actionAdded")
                    });
                    toast.success(message);
                    setSaveBoardGameSuccess(true);
                    fetchBoardGames();
                    return { success: true, message };
                })
                .catch((err) => {
                    setSaveBoardGameSuccess(false);
                    const message = t("boardGames.saveError");
                    toast.error(message);
                    console.trace(err);
                    return { success: false, message };
                });
        }
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
                        toast.error(err.response?.data?.error || t("boardGames.notFound"));
                        console.trace(err);
                    });
            }
            return;
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
            if (totalExpansions > 0) {
                warningText = t("boardGames.expansionsWarning", { count: totalExpansions });
            }

            const titles = games.map(g => g.title).join("\n ");

            let message = "";
            if (games.length > 1) {
                message = t("boardGames.deleteConfirmMany", { count: games.length, titles });
            } else {
                message = t("boardGames.deleteConfirmSingle", { title: titles });
            }

            if (totalExpansions > 0) {
                message += `\n\n${warningText}`;
            }

            openConfirmDialog({
                text: message,
                title: games.length > 1 ? t("boardGames.deleteTitleMany") : t("boardGames.deleteTitleSingle"),
                onOk: () => {
                    Promise.all(idsToDelete.filter((id): id is string => typeof id === "string" && id !== undefined).map(id => deleteBoardGame(id)))
                        .then((results) => {
                            const successCount = results.filter(r => r.status === 200).length;
                            if (successCount === 0) throw new Error("Error! Board games not deleted");
                            toast.success(
                                successCount > 1
                                    ? t("boardGames.deleteSuccessMany", { count: successCount })
                                    : t("boardGames.deleteSuccessSingle", { title: games[0].title })
                            );
                            fetchBoardGames();
                        })
                        .catch((err) => {
                            toast.error(err.response?.data?.error || t("boardGames.deleteError"));
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
                    toast.error(err.response?.data?.error || t("boardGames.deleteLoadError"));
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
            {isLoggedIn && !isGuest &&
                <button type="button" className="addBtnTable" onClick={handleAddBoardGame} data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("boardGames.addNew")} />
            }
            <div ref={popRef} className={`showHideColumns ${showColumn.control ? "shown" : "hidden"}`}>
                <ShowHideColumns columns={getBoardGameTableColumns(t)} shown={showColumn} setShown={setShowColumn} />
            </div>
            <ServerPaginationTable
                title={t("boardGames.title", { count: countAll })}
                data={boardGames}
                columns={getBoardGameTableColumns(t)}
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
                                placeholder={t("boardGames.searchPlaceholder")}
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
                            data-tooltip-id="global-tooltip"
                            data-tooltip-content={t("books.showHideColumns")}
                            onClick={() => setShowColumn({ ...showColumn, control: !showColumn.control })}
                        />
                    </div>
                }
                rowActions={(_id, expandRow, isExpanded) => (
                    <div className="actionsRow">
                        {isLoggedIn && !isGuest && (
                            <>
                                <button
                                    data-tooltip-id="global-tooltip"
                                    data-tooltip-content={t("common.delete")}
                                    onClick={() => handleDeleteBoardGame(_id)}
                                    className="fa fa-trash"
                                />
                                <button
                                    data-tooltip-id="global-tooltip"
                                    data-tooltip-content={t("common.edit")}
                                    className="fa fa-pencil-alt"
                                    onClick={() => handleUpdateBoardGame(_id)}
                                />
                            </>
                        )}
                        <button
                            key={`detail-${_id}`}
                            data-tooltip-id="global-tooltip"
                            data-tooltip-content={t("common.details")}
                            className={`fa ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`}
                            onClick={() => expandRow()}
                        />
                    </div>
                )}
                expandedElement={(data) => <BoardGameDetail data={data} />}
                selectedChanged={(ids) => setSelectedBoardGames(ids)}
                showSelection={!isGuest}
            />
        </>
    );
}
