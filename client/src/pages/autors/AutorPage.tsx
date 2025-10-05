import React, { useEffect, useRef, useState } from "react";
import { IAutor, IBookColumnVisibility } from "../../type";
import { addAutor, deleteAutor, getAutor, getAutorInfo, getAutors, getMultipleAutorsInfo } from "../../API";
import { toast } from "react-toastify";
import {
    stringifyAutors,
    DEFAULT_PAGINATION,
    getAutorTableColumns,
    ShowHideColumns,
    isMobile
} from "@utils";
import { useAutorModal } from "@components/autors/useAutorModal";
import { openConfirmDialog } from "@components/ConfirmDialog";
import ServerPaginationTable from "../../components/table/TableSP";
import AutorDetail from "./AutorDetail";
import { SortingState } from "@tanstack/react-table";
import { useClickOutside } from "@hooks";
import "@styles/AutorPage.scss";
import { useAuth } from "@utils/context";
import { InputField } from "@components/inputs";

export default function AutorPage() {
    const { isLoggedIn, currentUser } = useAuth();
    const [autors, setAutors] = useState<IAutor[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [pagination, setPagination] = useState({
        ...DEFAULT_PAGINATION,
        sorting: [{ id: "lastName", desc: false }] as SortingState
    });
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [saveAutorSuccess, setSaveAutorSuccess] = useState<boolean | undefined>(undefined);
    const [showColumn, setShowColumn] = useState<IBookColumnVisibility>({
        control: false,
        firstName: true,
        lastName: true,
        role: !isMobile(),
        nationality: !isMobile(),
        dateOfBirth: !isMobile(),
        dateOfDeath: !isMobile(),
        note: !isMobile(),
        createdAt: false,
        updatedAt: !isMobile(),
    });
    const [selectedAutors, setSelectedAutors] = useState<string[]>([]);
    const popRef = useRef<HTMLDivElement>(null);
    const exceptRef = useRef<HTMLDivElement>(null);

    useClickOutside(popRef, () => {
        setShowColumn(prevState => ({
            ...prevState,
            control: false
        }));
    }, exceptRef);

    useEffect(() => {
        let currentTimeoutId: NodeJS.Timeout | null = null;

        // Check if there's a non-empty search term (trimming whitespace)
        if (pagination.search && pagination.search.trim() !== "") {
            // --- Debounce Logic for Search ---
            // Set a timeout to fetch after 1 second
            currentTimeoutId = setTimeout(() => {
                fetchAutors();
            }, 1000);

            // Store the ID of this *new* timeout in state.
            setTimeoutId(currentTimeoutId);

        } else {
            // --- Immediate Fetch Logic (No Search Term) ---
            // If a timeout was set from a *previous* state (where search was active), clear it now.
            if (timeoutId) {
                clearTimeout(timeoutId);
                setTimeoutId(null); // Clear the timeout ID from state
            }
            // Fetch immediately since there's no search term to debounce
            fetchAutors();
        }

        return () => {
            // If a timeout was created *in this specific effect run*, clear it.
            if (currentTimeoutId) {
                clearTimeout(currentTimeoutId);
            }
        };
    }, [pagination, currentUser]);

    // ### AUTORS ###
    const fetchAutors = (): void => {
        setLoading(true);
        getAutors(pagination)
            .then(({ data: { autors, count } }: any) => {
                setCountAll(count);
                setAutors(autors);
            })
            .catch((err: Error) => console.trace(err))
            .finally(() => setLoading(false));
    }

    const handleSaveAutor = (formData: IAutor | object | IAutor[]): void => {
        setSaveAutorSuccess(undefined);

        addAutor(formData)
            .then((res) => {
                if (Array.isArray(formData) && formData.length > 1) {
                    let message = "";
                    if (res.length < 5) {
                        message = `${res.length} autori boli úspešne upravení.`;
                    } else {
                        message = `${res.length} autorov bolo úspešne upravených.`;
                    }

                    toast.success(message);
                } else {
                    toast.success(
                        `Autor ${Array.isArray(res) ?
                            stringifyAutors({ autor: res[0].data.autor }) :
                            stringifyAutors({ autor: res.data.autor })[0].autorsFull}
                        bol úspešne ${(formData as IAutor)._id ? "uložený" : "pridaný"}.`);
                }
                setSaveAutorSuccess(true)
                fetchAutors();
            })
            .catch((err) => {
                toast.error(err.response?.data?.error || "Chyba! Autor nebol uložený!");
                console.trace("Error saving autor", err)
                setSaveAutorSuccess(false);
            });
    }

    const { openAutorModal } = useAutorModal();

    const handleUpdateAutor = (_id?: string): any => {
        setSaveAutorSuccess(undefined);

        if (_id) {
            const autorToUpdate = autors.find((autor: IAutor) => autor._id === _id);

            if (autorToUpdate) {
                // Use persistent modal for a single autor
                openAutorModal(
                    [autorToUpdate],
                    handleSaveAutor
                );
            } else {
                getAutor(_id)
                    .then(({ data }) => {
                        if (data.autor) {
                            // Use persistent modal for fetched autor
                            openAutorModal(
                                [data.autor],
                                handleSaveAutor
                            );
                        }
                    })
                    .catch((err) => {
                        toast.error(err.response?.data?.error || "Chyba! Autor nebol nájdený!");
                        console.trace(err)
                    })
            }
        }

        if (selectedAutors.length > 0) {
            const autorsToUpdate = autors.filter((autor: IAutor) => selectedAutors.includes(autor._id));
            // Use persistent modal for multiple selected autors
            openAutorModal(
                autorsToUpdate,
                handleSaveAutor
            );
        }
    }

    const handleDeleteAutor = async (_id?: string): Promise<void> => {
        try {
            const idsToDelete: string[] = [];

            if (selectedAutors.length > 0 && !selectedAutors.includes(_id!)) {
                // If specific _id is provided, or if we have selected autors but the provided _id
                // is not among them, we delete only the specified _id
                idsToDelete.push(_id!);
            } else if (selectedAutors.length > 0) {
                // If no specific _id is provided but we have selected autors,
                // or if the provided _id is already in the selection,
                // we delete all selected autors
                idsToDelete.push(...selectedAutors);
            } else if (_id) {
                // If there's no selection but a specific _id is provided, we delete only that
                idsToDelete.push(_id);
            } else {
                // If there's no _id and no selection, show error
                toast.error("Vyber aspoň jedného autora na vymazanie!");
                return;
            }

            if (idsToDelete.length === 1) {
                // Single autor delete (keep current logic)
                const autorToDelete =
                    autors.find((autor: IAutor) => autor._id === idsToDelete[0]) ??
                    (await getAutor(idsToDelete[0])).data.autor;

                const { books, lps } = (await getAutorInfo(autorToDelete!._id)).data;

                let warningText: string = "";
                if (books.length === 0) {
                    warningText = ""
                } else if (books.length === 1) {
                    warningText = "Tento autor má k sebe priradenú " + books.length + " knihu"
                } else if (books.length > 1 && books.length < 5) {
                    warningText = "Tento autor má k sebe priradené " + books.length + " knihy"
                } else {
                    warningText = "Tento autor má k sebe priradených " + books.length + " kníh"
                }

                if (lps.length > 0) {
                    warningText += " a " + lps.length + " LP";
                }

                if (books.length > 0 || lps.length > 0) warningText += "!";

                openConfirmDialog({
                    title: "Vymazať autora?",
                    text: `Naozaj chceš vymazať autora ${autorToDelete?.fullName}?\n${warningText}`,
                    onOk: () => {
                        deleteAutor(idsToDelete[0])
                            .then(({ status }) => {
                                if (status !== 200) {
                                    throw new Error("Error! Autor not deleted")
                                }
                                toast.success(`Autor ${autorToDelete?.fullName} bol úspešne vymazaný.`);
                                fetchAutors();
                            })
                            .catch((err) => {
                                toast.error("Chyba! Autora nemožno vymazať!");
                                console.trace(err);
                            })
                    },
                    onCancel: () => { }
                });
            } else {
                // Multiple delete: get info for all autors
                const autorsInfoResp = await getMultipleAutorsInfo(idsToDelete as string[]);
                const autorsInfo = (autorsInfoResp.data as any).autors;

                // Compose list: "firstname lastname: number of books"
                const list = autorsInfo.map((info: any) => {
                    const booksCount = info.books?.length || 0;

                    let bookWarning = "";
                    if (booksCount === 1) {
                        bookWarning = " kniha";
                    } else if (booksCount > 1 && booksCount < 5) {
                        bookWarning = " knihy";
                    } else if (booksCount >= 5 || booksCount === 0) {
                        bookWarning = " kníh";
                    }

                    const autor = autors.find(a => a._id === info.id);
                    return `${autor?.firstName || ""} ${autor?.lastName || ""}: ${booksCount}${bookWarning}`.trim();
                }).join("\n");

                openConfirmDialog({
                    title: "Vymazať autorov?",
                    text: `Naozaj chceš vymazať ${autors.length} autorov?\n\n${list}`,
                    onOk: async () => {
                        try {
                            await Promise.all(idsToDelete.map(id => deleteAutor(id)));
                            toast.success("Autori boli úspešne vymazaní.");
                            fetchAutors();
                        } catch (err) {
                            toast.error("Chyba! Niektorých autorov nemožno vymazať!");
                        }
                    },
                    onCancel: () => { }
                });
            }
        } catch (err) {
            console.error(err);
        }
    }

    const handlePageSizeChange = (newPageSize: number) => {
        const newPage = Math.floor(((pagination.page - 1) * pagination.pageSize) / newPageSize) + 1;
        setPagination(prevState => ({ ...prevState, page: newPage, pageSize: newPageSize }));
    };

    // Handle adding a new autor
    const handleAddAutor = () => {
        openAutorModal([], handleSaveAutor);
    };

    return (
        <>
            <div ref={popRef} className={`showHideColumns ${showColumn.control ? "shown" : "hidden"}`}>
                <ShowHideColumns columns={getAutorTableColumns()} shown={showColumn} setShown={setShowColumn} />
            </div>
            <ServerPaginationTable
                title={`Autori (${countAll})`}
                data={autors}
                columns={getAutorTableColumns()}
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
                                placeholder="Vyhľadaj autora"
                                value={pagination.search}
                                onChange={(e) =>
                                    /* reset pagination on search*/
                                    setPagination(prevState => ({
                                        ...prevState,
                                        page: DEFAULT_PAGINATION.page,
                                        search: e.target.value
                                    }))}
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
                        {/* Add autor button for authenticated users */}
                        {isLoggedIn && (
                            <button
                                type="button"
                                className="addBtnTable"
                                onClick={handleAddAutor}
                                title="Pridať nového autora"
                            />
                        )}
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
                            title="¨Vymazať"
                            onClick={() => handleDeleteAutor(_id)}
                            className="fa fa-trash"
                        />
                        <button
                            title="Upraviť"
                            className="fa fa-pencil-alt"
                            onClick={() => handleUpdateAutor(_id)}
                        />
                        <button
                            title="Detaily"
                            className="fa fa-chevron-down"
                            onClick={() => expandRow()}
                        />
                    </div>
                ) : undefined}
                expandedElement={(data) => <AutorDetail data={data} />}
                selectedChanged={(ids) => setSelectedAutors(ids)}
            />
        </>
    )
}
