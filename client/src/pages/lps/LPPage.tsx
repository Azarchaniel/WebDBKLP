import AddLP from "./AddLP";
import { IBookColumnVisibility, ILP } from "../../type";
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
import { openConfirmDialog } from "@components/ConfirmDialog";
import ServerPaginationTable from "@components/table/TableSP";
import { useClickOutside } from "@hooks";
import "@styles/LpPage.scss";
import { useAuth } from "@utils/context";
import { InputField } from "@components/inputs";

export default function LPPage() {
    const { isLoggedIn, currentUser } = useAuth();
    const [updateLP, setUpdateLP] = useState<ILP[] | ILP | undefined>();
    const [LPs, setLPs] = useState<ILP[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
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
        fetchLPs();
    }, [currentUser])

    useEffect(() => {
        if (timeoutId) clearTimeout(timeoutId);

        const newTimeoutId = setTimeout(() => {
            fetchLPs();
        }, 1000); // Wait 1s before making the request

        setTimeoutId(newTimeoutId);
        // Cleanup function to clear timeout if component unmounts or pagination changes again
        return () => {
            if (newTimeoutId) clearTimeout(newTimeoutId);
        };
    }, [pagination]);

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

    const handleSaveLP = (formData: ILP[] | ILP | object): void => {
        setSaveLpSuccess(undefined);
        // Multi-edit support
        if (Array.isArray(formData) && formData.length > 1) {
            // TODO: Implement batch update API if available, else loop
            Promise.all(formData.map(lp => addLP(lp)))
                .then((results) => {
                    toast.success(`Uložených ${results.length} LP.`);
                    setSaveLpSuccess(true);
                    fetchLPs();
                })
                .catch((err) => {
                    setSaveLpSuccess(false);
                    toast.error("Niektoré LP sa nepodarilo uložiť!");
                    console.trace(err);
                });
        } else {
            addLP(Array.isArray(formData) ? formData[0] : (formData as ILP))
                .then(({ status, data }) => {
                    let isEdit = false;
                    if (Array.isArray(formData)) {
                        isEdit = !!formData[0]?._id;
                    } else if (typeof formData === 'object' && formData !== null && '_id' in formData) {
                        isEdit = !!(formData as any)._id;
                    }
                    if (status !== 201) {
                        toast.error(`Chyba! LP ${data.lp?.title} nebolo ${isEdit ? "uložené" : "pridané"}.`)
                        throw new Error("LP sa nepodarilo pridať!")
                    }
                    toast.success(`LP ${data.lp?.title} bolo úspešne ${isEdit ? "uložené" : "pridané"}.`);
                    setSaveLpSuccess(true);
                    setLPs(stringifyAutors(data.lps));
                })
                .catch((err) => {
                    setSaveLpSuccess(false);
                    toast.error("LP sa nepodarilo pridať!");
                    console.trace(err);
                });
        }
    }

    const handleUpdateLp = (_id?: string): any => {
        setSaveLpSuccess(undefined);
        if (_id) {
            const lpToUpdate = LPs.find((lp: ILP) => lp._id === _id);
            if (lpToUpdate) {
                setUpdateLP([lpToUpdate]);
            } else {
                getLP(_id)
                    .then(({ data }) => {
                        if (data.lp) setUpdateLP([data.lp]);
                        setSaveLpSuccess(true);
                    })
                    .catch((err) => {
                        console.trace(err);
                        setSaveLpSuccess(true);
                    })
            }
        }
        if (selectedLPs.length > 0) {
            const lpsToUpdate = LPs.filter((lp: ILP) => selectedLPs.includes(lp._id));
            setUpdateLP(lpsToUpdate);
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
            toast.error("Vyber aspoň jedno LP na vymazanie!");
            return;
        }

        // Get LP objects for confirmation dialog
        const lpsToDelete = LPs.filter((lp: ILP) => idsToDelete.includes(lp._id));

        const proceedDelete = (lps: ILP[]) => {
            const titles = lps.map(lp => lp.title).join("\n ");

            let message = "";
            if (lps.length > 1) {
                message = `Naozaj chceš vymazať ${lps.length} LP?\n\n ${titles}`;
            } else {
                message = `Naozaj chceš vymazať LP ${titles}?`;
            }

            openConfirmDialog({
                text: message,
                title: lps.length > 1 ? "Vymazať LP?" : "Vymazať LP?",
                onOk: () => {
                    Promise.all(idsToDelete.filter((id): id is string => typeof id === "string" && id !== undefined)
                        .map(id => deleteLP(id)))
                        .then((results) => {
                            const successCount = results.filter(r => r.status === 200).length;
                            if (successCount === 0) throw new Error("Error! LPs not deleted");
                            toast.success(
                                successCount > 1
                                    ? `${successCount} LP bolo úspešne vymazaných.`
                                    : `LP ${lps[0].title} bolo úspešne vymazané.`
                            );
                            fetchLPs();
                        })
                        .catch((err) => {
                            toast.error(err.response?.data?.error || "Došlo k chybe pri mazaní!");
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
                    toast.error(err.response?.data?.error || "Chyba pri načítaní LP!");
                    console.trace(err);
                });
        }
    };

    const handlePageSizeChange = (newPageSize: number) => {
        const newPage = Math.floor(((pagination.page - 1) * pagination.pageSize) / newPageSize) + 1;
        setPagination(prevState => ({ ...prevState, page: newPage, pageSize: newPageSize }));
    };

    return (
        <>
            {isLoggedIn && <AddLP saveLp={handleSaveLP} onClose={() => setUpdateLP(undefined)} saveResultSuccess={saveLpSuccess} />}
            <div ref={popRef} className={`showHideColumns ${showColumn.control ? "shown" : "hidden"}`}>
                <ShowHideColumns columns={getLPTableColumns()} shown={showColumn} setShown={setShowColumn} />
            </div>
            <ServerPaginationTable
                title={`LP (${countAll})`}
                data={LPs}
                columns={getLPTableColumns()}
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
                                placeholder="Vyhľadaj LP"
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
                        <i
                            ref={exceptRef}
                            className="fas fa-bars bookTableAction ml-4"
                            title="Zobraz/skry stĺpce"
                            onClick={() => setShowColumn({ ...showColumn, control: !showColumn.control })}
                        />
                    </div>
                }
                rowActions={isLoggedIn ? (_id) => (
                    <div className="actionsRow" style={{ pointerEvents: "auto" }}>
                        <button
                            title="¨Vymazať"
                            onClick={() => handleDeleteLP(_id)}
                            className="fa fa-trash"
                        />
                        <button
                            title="Upraviť"
                            className="fa fa-pencil-alt"
                            onClick={() => handleUpdateLp(_id)}
                        />
                    </div>
                ) : undefined}
                selectedChanged={(ids) => setSelectedLPs(ids)}
            />
            {Boolean(updateLP) &&
                <AddLP
                    saveLp={handleSaveLP}
                    lps={updateLP as ILP[]}
                    onClose={() => setUpdateLP(undefined)}
                    saveResultSuccess={saveLpSuccess}
                />}
        </>
    )
}