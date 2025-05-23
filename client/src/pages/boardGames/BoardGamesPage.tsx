import React, { useEffect, useRef, useState } from "react";
import { IBookColumnVisibility } from "../../type";
import { getBoardGames, addBoardGame, deleteBoardGame, getBoardGame } from "../../API";
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
import {InputField} from "@components/inputs";

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

    const handleSaveBoardGame = (formData: any): void => {
        setSaveBoardGameSuccess(undefined);

        addBoardGame(formData)
            .then(({ status }) => {
                if (status !== 201) {
                    toast.error(`Chyba! Spoločenská hra ${formData?.title} nebola ${formData._id ? "upravená" : "pridaná"}.`);
                    throw new Error("Error! Board game was not added!");
                }
                toast.success(`Spoločenská hra ${formData?.title} bola úspešne ${formData._id ? "upravená" : "pridaná"}.`);
                setSaveBoardGameSuccess(true);
                fetchBoardGames();
            })
            .catch((err) => {
                console.trace(err);
                setSaveBoardGameSuccess(false);
            });
    };

    const handleUpdateBoardGame = (_id: string): void => {
        setSaveBoardGameSuccess(undefined);
        const boardGameToUpdate = boardGames.find((boardGame: any) => boardGame._id === _id);
        if (boardGameToUpdate) {
            setUpdateBoardGame(boardGameToUpdate);
        } else {
            getBoardGame(_id)
                .then(({ data }) => {
                    setUpdateBoardGame(data.boardGame);
                })
                .catch((err) => console.trace(err));
        }
    };

    const handleDeleteBoardGame = (_id: string): void => {
        openConfirmDialog({
            title: "Vymazať spoločenskú hru?",
            text: "Naozaj chcete odstrániť túto spoločenskú hru?",
            onOk: () => {
                deleteBoardGame(_id)
                    .then(({ status }) => {
                        if (status !== 200) {
                            throw new Error("Error! Board game not deleted");
                        }
                        toast.success("Spoločenská hra bola úspešne vymazaná.");
                        fetchBoardGames();
                    })
                    .catch((err) => {
                        toast.error("Chyba! Spoločenskú hru sa nepodarilo odstrániť!");
                        console.trace(err);
                    });
            },
            onCancel: () => {}
        });
    };

    const handlePageSizeChange = (newPageSize: number) => {
        const newPage = Math.floor(((pagination.page - 1) * pagination.pageSize) / newPageSize) + 1;
        setPagination(prevState => ({ ...prevState, page: newPage, pageSize: newPageSize }));
    };

    return (
        <>
            {isLoggedIn && <AddBoardGame saveBoardGame={handleSaveBoardGame} onClose={() => setUpdateBoardGame(undefined)} saveResultSuccess={saveBoardGameSuccess} />}
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
                                }))}>✖</button>
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
                rowActions={(_id) => (
                    isLoggedIn ? <div className="actionsRow" style={{ pointerEvents: "auto" }}>
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
                    </div> : <></>
                )}
            />
			{Boolean(updateBoardGame) &&
                <AddBoardGame
                    saveBoardGame={handleSaveBoardGame}
                    boardGame={updateBoardGame}
                    onClose={() => setUpdateBoardGame(undefined)}
                    saveResultSuccess={saveBoardGameSuccess}
                />}
        </>
    );
}
