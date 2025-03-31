import AddLP from "./AddLP";
import {IBookColumnVisibility, ILP} from "../../type";
import React, {useEffect, useRef, useState} from "react";
import {addLP, deleteLP, getLPs, getLP} from "../../API";
import {toast} from "react-toastify";
import {stringifyAutors} from "../../utils/utils";
import {DEFAULT_PAGINATION} from "../../utils/constants";
import {openConfirmDialog} from "../../components/ConfirmDialog";
import {isUserLoggedIn} from "../../utils/user";
import ServerPaginationTable from "../../components/table/TableSP";
import {getLPTableColumns, ShowHideColumns} from "../../utils/tableColumns";
import {useClickOutside} from "../../utils/hooks";
import Layout from "../../Layout";

export default function LPPage() {
    const [updateLP, setUpdateLP] = useState<ILP>();
    const [LPs, setLPs] = useState<ILP[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [saveLpSuccess, setSaveLpSuccess] = useState<boolean | undefined>(undefined);
    const [loading, setLoading] = useState<boolean>(true);
    const [showColumn, setShowColumn] = useState<IBookColumnVisibility>({
        control: false,
        autorsFull: true,
        subtitle: false,
        language: false,
        createdAt: true,
        speed: true,
        countLp: true,
        published: true
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
        fetchLPs();
    }, [])

    useEffect(() => {
        if (!timeoutId || pagination.search === "") return fetchLPs();
        if (timeoutId) clearTimeout(timeoutId);

        const newTimeoutId = setTimeout(() => {
            fetchLPs();
        }, 1000); // Wait 1s before making the request

        setTimeoutId(newTimeoutId);
    }, [pagination]);

    // ### QUOTES ###
    const fetchLPs = (): void => {
        setLoading(true);
        getLPs(pagination)
            .then(({data: {lps, count}}: ILP[] | any) => {
                setLPs(stringifyAutors(lps));
                setCountAll(count);
            })
            .catch((err: Error) => console.trace(err))
            .finally(() => setLoading(false));
    }

    const handleSaveLP = (formData: ILP): void => {
        addLP(formData)
            .then(({status, data}) => {
                if (status !== 201) {
                    toast.error(`Chyba! LP ${data.lp?.title} nebolo ${formData._id ? "uložené" : "pridané"}.`)
                    throw new Error("LP sa nepodarilo pridať!")
                }
                toast.success(`LP ${data.lp?.title} bolo úspešne ${formData._id ? "uložené" : "pridané"}.`);
                setLPs(stringifyAutors(data.lps));
            })
            .catch((err) => {
                toast.error("LP sa nepodarilo pridať!");
                console.trace(err);
            })
    }

    const handleUpdateLp = (_id: string): any => {
        setSaveLpSuccess(undefined);

        const lpToUpdate = LPs.find((lp: ILP) => lp._id === _id);

        if (lpToUpdate) {
            setUpdateLP(lpToUpdate);
        } else {
            getLP(_id)
                .then(({data}) => {
                    setUpdateLP(data.lp);
                })
                .catch((err) => console.trace(err))
        }
    }

    const handleDeleteLP = (_id: string): void => {
        let lpToDelete = LPs.find((lp: ILP) => lp._id === _id);

        if (!lpToDelete) {
            getLP(_id)
                .then(({data}) => {
                    lpToDelete = data.lp;
                })
                .catch((err) => console.trace(err))
        }

        openConfirmDialog({
            title: "Vymazať LP?",
            text: "Naozaj chceš vymazať LP " + lpToDelete?.title + "?",
            onOk: () => {
                deleteLP(_id)
                    .then(({status}) => {
                        if (status !== 200) {
                            throw new Error("Error! LP not deleted")
                        }
                        toast.success("LP bolo úspešne vymazané.");
                        fetchLPs();
                    })
                    .catch((err) => {
                        toast.error("Došlo k chybe!");
                        console.trace(err);
                    })
            },
            onCancel: () => {
            }
        });
    }

    const handlePageSizeChange = (newPageSize: number) => {
        const newPage = Math.floor(((pagination.page - 1) * pagination.pageSize) / newPageSize) + 1;
        setPagination(prevState => ({...prevState, page: newPage, pageSize: newPageSize}));
    };

    return (
        <Layout>
            {isUserLoggedIn() && <AddLP saveLp={handleSaveLP} onClose={() => setUpdateLP(undefined)}/>}
            <div ref={popRef} className={`showHideColumns ${showColumn.control ? "shown" : "hidden"}`}>
                <ShowHideColumns columns={getLPTableColumns()} shown={showColumn} setShown={setShowColumn} />
            </div>
            <ServerPaginationTable
                title={`LP (${countAll})`}
                data={LPs}
                columns={getLPTableColumns()}
                pageChange={(page) => setPagination(prevState => ({...prevState, page: page}))}
                pageSizeChange={handlePageSizeChange}
                sortingChange={(sorting) => setPagination(prevState => ({...prevState, sorting: sorting}))}
                totalCount={countAll}
                loading={loading}
                pagination={pagination}
                hiddenCols={showColumn}
                actions={
                    <div className="row justify-center mb-4 mr-2">
                        <div className="searchTableWrapper">
                            {/* reset pagination on search*/}
                            <input
                                className="form-control"
                                style={{paddingRight: "2rem"}}
                                placeholder="Vyhľadaj LP"
                                value={pagination.search}
                                onChange={(e) =>
                                    setPagination(prevState => ({
                                        ...prevState,
                                        page: DEFAULT_PAGINATION.page,
                                        search: e.target.value
                                    }))}
                            />
                            <button onClick={() => setPagination(prevState => ({
                                ...prevState,
                                page: DEFAULT_PAGINATION.page,
                                search: ""
                            }))}>✖
                            </button>
                        </div>
                        <i
                            ref={exceptRef}
                            className="fas fa-bars bookTableAction ml-4"
                            title="Zobraz/skry stĺpce"
                            onClick={() => setShowColumn({...showColumn, control: !showColumn.control})}
                        />
                    </div>
                }
                rowActions={(_id) => (
                    isUserLoggedIn() ? <div className="actionsRow" style={{pointerEvents: "auto"}}>
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
                    </div> : <></>
                )}
            />
            {Boolean(updateLP) &&
                <AddLP
                    saveLp={handleSaveLP}
                    lp={updateLP}
                    onClose={() => setUpdateLP(undefined)}
                    saveResultSuccess={saveLpSuccess}
                />}
        </Layout>
    )
}