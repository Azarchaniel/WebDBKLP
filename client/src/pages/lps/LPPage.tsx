import { IBookColumnVisibility, ILP, SaveEntity, SaveEntityResult } from "../../type";
import { useEffect, useRef, useState } from "react";
import { addLP, deleteLP, getLPs, getLP } from "../../API";
import { toast } from "react-toastify";
import {
    isMobile,
    stringifyAutors,
    DEFAULT_PAGINATION,
    getLPTableColumns,
    ShowHideColumns
} from "@utils";
import { useLPModal } from "@components/lps/useLPModal";
import { openConfirmDialog } from "@components/ConfirmDialog";
import ServerPaginationTable from "@components/table/TableSP";
import { useClickOutside } from "@hooks";
import "@styles/LpPage.scss";
import { useAuth } from "@utils/context";
import { InputField } from "@components/inputs";
import { useTranslation } from "react-i18next";

export default function LPPage() {
    const { t } = useTranslation();
    const { isLoggedIn, isGuest, currentUser } = useAuth();
    const [LPs, setLPs] = useState<ILP[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [saveLpSuccess, setSaveLpSuccess] = useState<boolean | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [showColumn, setShowColumn] = useState<IBookColumnVisibility>({
        control: false,
        autorsFull: true,
        subtitle: !isMobile(),
        language: !isMobile(),
        speed: !isMobile(),
        countLp: !isMobile(),
        published: !isMobile(),
        createdAt: false,
        updatedAt: !isMobile(),
    });
    const [selectedLPs, setSelectedLPs] = useState<string[]>([]);
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
        timeoutRef.current = setTimeout(() => {
            fetchLPs();
        }, 1000);
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [pagination, currentUser]);

    // ### QUOTES ###
    const fetchLPs = (): void => {
        setLoading(true);
        getLPs(pagination)
            .then(({ data: { lps, count } }: ILP[] | any) => {
                setLPs(stringifyAutors(lps));
                setCountAll(count);
            })
            .catch((err: Error) => console.trace(err))
            .finally(() => setLoading(false));
    }

    const handleSaveLP = async (formData: SaveEntity<ILP>): Promise<SaveEntityResult> => {
        setSaveLpSuccess(undefined);
        const isNewLp = Array.isArray(formData)
            ? formData.some((lp) => !(lp as ILP)._id)
            : !(formData as ILP)._id;

        if (Array.isArray(formData) && formData.length > 1) {
            // Multi-edit support
            return Promise.all(formData.map(lp => addLP(lp)))
                .then((results) => {
                    const message = t("lp.saveManySuccess", { count: results.length });
                    toast.success(message);
                    setSaveLpSuccess(true);
                    fetchLPs();
                    return { success: true, message };
                })
                .catch((err) => {
                    setSaveLpSuccess(false);
                    const message = t("lp.saveManyError");
                    toast.error(message);
                    console.trace(err);
                    return { success: false, message };
                });
        } else {
            return addLP(Array.isArray(formData) ? formData[0] : (formData as ILP))
                .then((result) => {
                    let message = "";
                    if (result.status !== 201) {
                        message = t("lp.saveErrorSingle", {
                            title: result.data.lp?.title,
                            action: !isNewLp ? t("lp.actionSaved") : t("lp.actionAdded")
                        });
                        toast.error(message);
                        setSaveLpSuccess(false);
                        return { success: false, message };
                    }
                    message = t("lp.saveSuccessSingle", {
                        title: result.data.lp?.title,
                        action: !isNewLp ? t("lp.actionSaved") : t("lp.actionAdded")
                    });
                    toast.success(message);
                    setSaveLpSuccess(true);
                    setLPs(stringifyAutors(result.data.lps));
                    return { success: true, message };
                })
                .catch((err) => {
                    setSaveLpSuccess(false);
                    const message = t("lp.saveError");
                    toast.error(message);
                    console.trace(err);
                    return { success: false, message };
                });
        }
    }

    const { openLPModal } = useLPModal();

    const handleUpdateLp = (_id?: string): any => {
        setSaveLpSuccess(undefined);
        if (_id) {
            const lpToUpdate = LPs.find((lp: ILP) => lp._id === _id);
            if (lpToUpdate) {
                // Use persistent modal for a single LP
                openLPModal(
                    [lpToUpdate],
                    handleSaveLP
                );
            } else {
                getLP(_id)
                    .then(({ data }) => {
                        if (data.lp) {
                            // Use persistent modal for fetched LP
                            openLPModal(
                                [data.lp],
                                handleSaveLP
                            );
                        }
                        setSaveLpSuccess(true);
                    })
                    .catch((err) => {
                        console.trace(err);
                        setSaveLpSuccess(true);
                    })
            }
            return;
        }
        if (selectedLPs.length > 0) {
            const lpsToUpdate = LPs.filter((lp: ILP) => selectedLPs.includes(lp._id));
            // Use persistent modal for multiple selected LPs
            openLPModal(
                lpsToUpdate,
                handleSaveLP
            );
        }
    }

    const handleDeleteLP = async (_id?: string): Promise<void> => {
        const idsToDelete: string[] = [];

        if (selectedLPs.length > 0 && !selectedLPs.includes(_id!)) {
            // If specific _id is provided, or if we have selected LPs but the provided _id
            // is not among them, we delete only the specified _id
            idsToDelete.push(_id!);
        } else if (selectedLPs.length > 0) {
            // If no specific _id is provided but we have selected LPs,
            // or if the provided _id is already in the selection,
            // we delete all selected LPs
            idsToDelete.push(...selectedLPs);
        } else if (_id) {
            // If there's no selection but a specific _id is provided, we delete only that
            idsToDelete.push(_id);
        } else {
            // If there's no _id and no selection, show error
            toast.error(t("lp.deleteSelectError"));
            return;
        }

        // Get LP objects for confirmation dialog
        const lpsToDelete = LPs.filter((lp: ILP) => idsToDelete.includes(lp._id));

        const proceedDelete = (lps: ILP[]) => {
            const titles = lps.map(lp => lp.title).join("\n ");

            let message = "";
            if (lps.length > 1) {
                message = t("lp.deleteConfirmMany", { count: lps.length, titles });
            } else {
                message = t("lp.deleteConfirmSingle", { title: titles });
            }

            openConfirmDialog({
                text: message,
                title: t("lp.deleteTitle"),
                onOk: () => {
                    Promise.all(idsToDelete.filter((id): id is string => typeof id === "string" && id !== undefined)
                        .map(id => deleteLP(id)))
                        .then((results) => {
                            const successCount = results.filter(r => r.status === 200).length;
                            if (successCount === 0) throw new Error("Error! LPs not deleted");
                            toast.success(
                                successCount > 1
                                    ? t("lp.deleteSuccessMany", { count: successCount })
                                    : t("lp.deleteSuccessSingle", { title: lps[0].title })
                            );
                            fetchLPs();
                        })
                        .catch((err) => {
                            toast.error(err.response?.data?.error || t("lp.deleteError"));
                            console.trace(err);
                        });
                },
                onCancel: () => { }
            });
        };

        if (lpsToDelete.length === idsToDelete.length) {
            proceedDelete(lpsToDelete);
        } else {
            // Some LPs not in local state, fetch them
            Promise.all(idsToDelete.filter(id => typeof id === "string").map(id => {
                const localLP = LPs.find((lp: ILP) => lp._id === id);
                return localLP
                    ? Promise.resolve(localLP)
                    : id ? getLP(id).then(({ data }) => data.lp) : Promise.resolve(undefined);
            }))
                .then((lps) => proceedDelete(lps.filter(Boolean) as ILP[]))
                .catch((err) => {
                    toast.error(err.response?.data?.error || t("lp.deleteError"));
                    console.trace(err);
                });
        }
    };

    const handlePageSizeChange = (newPageSize: number) => {
        const newPage = Math.floor(((pagination.page - 1) * pagination.pageSize) / newPageSize) + 1;
        setPagination(prevState => ({ ...prevState, page: newPage, pageSize: newPageSize }));
    };

    // Handle adding a new LP
    const handleAddLP = () => {
        openLPModal([], handleSaveLP);
    };

    return (
        <>
            <div ref={popRef} className={`showHideColumns ${showColumn.control ? "shown" : "hidden"}`}>
                <ShowHideColumns columns={getLPTableColumns(t)} shown={showColumn} setShown={setShowColumn} />
            </div>
            <ServerPaginationTable
                title={t("lp.title", { count: countAll })}
                data={LPs}
                columns={getLPTableColumns(t)}
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
                            {/* reset pagination on search*/}
                            <InputField
                                className="form-control"
                                style={{ paddingRight: "2rem" }}
                                placeholder={t("lp.searchPlaceholder")}
                                value={pagination.search}
                                onChange={(e) =>
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
                        {/* Add LP button for authenticated users */}
                        {isLoggedIn && !isGuest && (
                            <button
                                type="button"
                                className="addBtnTable"
                                data-tooltip-id="global-tooltip"
                                data-tooltip-content={t("lp.addNew")}
                                onClick={handleAddLP}
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
                rowActions={isLoggedIn && !isGuest ? (_id) => (
                    <div className="actionsRow">
                        <button
                            data-tooltip-id="global-tooltip"
                            data-tooltip-content={t("common.delete")}
                            onClick={() => handleDeleteLP(_id)}
                            className="fa fa-trash"
                        />
                        <button
                            data-tooltip-id="global-tooltip"
                            data-tooltip-content={t("common.edit")}
                            className="fa fa-pencil-alt"
                            onClick={() => handleUpdateLp(_id)}
                        />
                    </div>
                ) : undefined}
                selectedChanged={(ids) => setSelectedLPs(ids)}
                showSelection={!isGuest}
            />
        </>
    )
}