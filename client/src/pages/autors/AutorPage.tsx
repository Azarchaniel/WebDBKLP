import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { IAutor, IBookColumnVisibility, SaveEntity, SaveEntityResult } from "../../type";
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
import { useTranslation } from "react-i18next";

export default function AutorPage() {
    const { t } = useTranslation();
    const { id } = useParams<{ id?: string }>();
    const { isLoggedIn, isGuest, currentUser } = useAuth();
    const [autors, setAutors] = useState<IAutor[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [pagination, setPagination] = useState({
        ...DEFAULT_PAGINATION,
        search: id ?? DEFAULT_PAGINATION.search,
        sorting: [{ id: "lastName", desc: false }] as SortingState
    });
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (pagination.search && pagination.search.trim() !== "") {
            timeoutRef.current = setTimeout(() => {
                fetchAutors();
            }, 1000);
        } else {
            timeoutRef.current = null;
            fetchAutors();
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
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

    const handleSaveAutor = async (formData: SaveEntity<IAutor>): Promise<SaveEntityResult> => {
        setSaveAutorSuccess(undefined);
        const isNewAutor = Array.isArray(formData)
            ? formData.some((autor) => !(autor as IAutor)._id)
            : !(formData as IAutor)._id;

        return addAutor(formData)
            .then((res) => {
                let message = "";
                if (Array.isArray(formData) && formData.length > 1) {
                    message = t("autors.saveManySuccess", { count: res.length });
                } else {
                    const autorName = Array.isArray(res)
                        ? stringifyAutors({ autor: res[0].data.autor })[0].autorsFull
                        : stringifyAutors({ autor: res.data.autor })[0].autorsFull;
                    message = t("autors.saveSuccessSingle", {
                        name: autorName,
                        action: !isNewAutor ? t("autors.actionSaved") : t("autors.actionAdded")
                    });
                }
                toast.success(message);
                setSaveAutorSuccess(true)
                fetchAutors();
                return { success: true, message };
            })
            .catch((err) => {
                const message = err.response?.data?.error || t("autors.saveError");
                toast.error(message);
                console.trace("Error saving autor", err)
                setSaveAutorSuccess(false);
                return { success: false, message };
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
                        toast.error(err.response?.data?.error || t("autors.notFound"));
                        console.trace(err)
                    })
            }
            return;
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
                toast.error(t("autors.deleteSelectError"));
                return;
            }

            if (idsToDelete.length === 1) {
                // Single autor delete (keep current logic)
                const autorToDelete =
                    autors.find((autor: IAutor) => autor._id === idsToDelete[0]) ??
                    (await getAutor(idsToDelete[0])).data.autor;

                const { books, lps } = (await getAutorInfo(autorToDelete!._id)).data;

                let warningText: string = "";
                if (books.length > 0) {
                    warningText = t("autors.warningBooks", { count: books.length });
                }

                if (lps.length > 0) {
                    warningText += " " + t("autors.warningLps", { count: lps.length });
                }

                if (books.length > 0 || lps.length > 0) warningText += "!";

                openConfirmDialog({
                    title: t("autors.deleteTitleSingle"),
                    text: `${t("autors.deleteConfirmSingle", { name: autorToDelete?.fullName })}\n${warningText}`,
                    onOk: () => {
                        deleteAutor(idsToDelete[0])
                            .then(({ status }) => {
                                if (status !== 200) {
                                    throw new Error("Error! Autor not deleted")
                                }
                                toast.success(t("autors.deleteSuccessSingle", { name: autorToDelete?.fullName }));
                                fetchAutors();
                            })
                            .catch((err) => {
                                toast.error(t("autors.deleteError"));
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
                    const autor = autors.find(a => a._id === info.id);
                    return `${autor?.firstName || ""} ${autor?.lastName || ""}: ${t("books.countShort", { count: booksCount })}`.trim();
                }).join("\n");

                openConfirmDialog({
                    title: t("autors.deleteTitleMany"),
                    text: `${t("autors.deleteConfirmMany", { count: idsToDelete.length })}\n\n${list}`,
                    onOk: async () => {
                        try {
                            await Promise.all(idsToDelete.map(id => deleteAutor(id)));
                            toast.success(t("autors.deleteSuccessMany"));
                            fetchAutors();
                        } catch (err) {
                            toast.error(t("autors.deleteErrorMany"));
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
        openAutorModal([], handleSaveAutor, saveAutorSuccess);
    };

    return (
        <>
            <div ref={popRef} className={`showHideColumns ${showColumn.control ? "shown" : "hidden"}`}>
                <ShowHideColumns columns={getAutorTableColumns(t)} shown={showColumn} setShown={setShowColumn} />
            </div>
            <ServerPaginationTable
                title={t("autors.pageTitle", { count: countAll })}
                data={autors}
                columns={getAutorTableColumns(t)}
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
                                placeholder={t("autors.searchPlaceholder")}
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
                        {isLoggedIn && !isGuest && (
                            <button
                                type="button"
                                className="addBtnTable"
                                data-tooltip-id="global-tooltip"
                                data-tooltip-content={t("autors.addNew")}
                                onClick={handleAddAutor}
                            />
                        )}
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
                                    onClick={() => handleDeleteAutor(_id)}
                                    className="fa fa-trash"
                                />
                                <button
                                    data-tooltip-id="global-tooltip"
                                    data-tooltip-content={t("common.edit")}
                                    className="fa fa-pencil-alt"
                                    onClick={() => handleUpdateAutor(_id)}
                                />
                            </>
                        )}
                        <button
                            data-tooltip-id="global-tooltip"
                            data-tooltip-content={t("common.details")}
                            className={`fa ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`}
                            onClick={() => expandRow()}
                        />
                    </div>
                )}
                expandedElement={(data) => <AutorDetail data={data} />}
                selectedChanged={(ids) => setSelectedAutors(ids)}
                showSelection={!isGuest}
            />
        </>
    )
}
