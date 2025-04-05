import AddAutor from "./AddAutor";
import React, {useEffect, useRef, useState} from "react";
import {IAutor, IBookColumnVisibility} from "../../type";
import {addAutor, deleteAutor, getAutor, getAutorInfo, getAutors} from "../../API";
import {toast} from "react-toastify";
import {
    stringifyAutors,
    useClickOutside,
    DEFAULT_PAGINATION,
    getAutorTableColumns,
    ShowHideColumns,
    isUserLoggedIn, isMobile
} from "@utils";
import {openConfirmDialog} from "@components/ConfirmDialog";
import ServerPaginationTable from "../../components/table/TableSP";
import AutorDetail from "./AutorDetail";
import {SortingState} from "@tanstack/react-table";
import Layout from "../../Layout";
import "@styles/AutorPage.scss";

export default function AutorPage() {
    const [autors, setAutors] = useState<IAutor[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [updateAutor, setUpdateAutor] = useState<IAutor>();
    const [pagination, setPagination] = useState({
        ...DEFAULT_PAGINATION,
        sorting: [{id: "lastName", desc: false}] as SortingState
    });
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [saveAutorSuccess, setSaveAutorSuccess] = useState<boolean | undefined>(undefined);
    const [showColumn, setShowColumn] = useState<IBookColumnVisibility>({
        control: false,
        firstName: true,
        lastName: true,
        nationality: !isMobile(),
        dateOfBirth: !isMobile(),
        dateOfDeath: !isMobile(),
        note: !isMobile(),
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
        fetchAutors();
    }, [])

    useEffect(() => {
        if (timeoutId) clearTimeout(timeoutId);

        const newTimeoutId = setTimeout(() => {
            fetchAutors();
        }, 1000); // Wait 1s before making the request

        setTimeoutId(newTimeoutId);
        // Cleanup function to clear timeout if component unmounts or pagination changes again
        return () => {
            if (newTimeoutId) clearTimeout(newTimeoutId);
        };
    }, [pagination]);

    // ### AUTORS ###
    const fetchAutors = (): void => {
        setLoading(true);
        getAutors(pagination)
            .then(({data: {autors, count}}: any) => {
                setCountAll(count);
                setAutors(autors);
            })
            .catch((err: Error) => console.trace(err))
            .finally(() => setLoading(false));
    }

    const handleSaveAutor = (formData: IAutor): void => {
        addAutor(formData)
            .then(({status, data}) => {
                if (status !== 201) {
                    toast.error(`Chyba! Autor ${data.autor?.lastName} nebol ${formData._id ? "uložený" : "pridaný"}.`)
                    throw new Error("Chyba! Kniha nebola pridaná!");
                }
                const autorNames = stringifyAutors({autor: data.autor})[0].autorsFull;

                toast.success(`Autor ${autorNames} bol úspešne ${formData._id ? "uložený" : "pridaný"}.`);
                setSaveAutorSuccess(true)
                setAutors(data.autors);
            })
            .catch((err) => {
                console.trace(err)
                setSaveAutorSuccess(false);
            });
    }

    const handleUpdateAutor = (_id: string): any => {
        setSaveAutorSuccess(undefined);

        const autorToUpdate = autors.find((autor: IAutor) => autor._id === _id);

        if (autorToUpdate) {
            setUpdateAutor(autorToUpdate);
        } else {
            getAutor(_id)
                .then(({data}) => {
                    setUpdateAutor(data.autor);
                })
                .catch((err) => console.trace(err))
        }
    }

    const handleDeleteAutor = async (_id: string): Promise<void> => {
        try {
            const autorToDelete =
                autors.find((autor: IAutor) => autor._id === _id) ??
                (await getAutor(_id)).data.autor;

            const {books, lps} = (await getAutorInfo(autorToDelete!._id)).data;


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
                    deleteAutor(_id)
                        .then(({status, data}) => {
                            if (status !== 200) {
                                throw new Error("Error! Autor not deleted")
                            }
                            toast.success(`Autor ${autorToDelete?.fullName} bol úspešne vymazaný.`);
                            setAutors(data.autors)
                        })
                        .catch((err) => {
                            toast.error("Chyba! Autora nemožno vymazať!");
                            console.trace(err);
                        })
                },
                onCancel: () => {
                }
            });
        } catch (err) {
            console.error(err);
        }
    }

    const handlePageSizeChange = (newPageSize: number) => {
        const newPage = Math.floor(((pagination.page - 1) * pagination.pageSize) / newPageSize) + 1;
        setPagination(prevState => ({...prevState, page: newPage, pageSize: newPageSize}));
    };

    return (
        <Layout>
            {isUserLoggedIn() && <AddAutor saveAutor={handleSaveAutor} onClose={() => setUpdateAutor(undefined)}/>}
            <div ref={popRef} className={`showHideColumns ${showColumn.control ? "shown" : "hidden"}`}>
                <ShowHideColumns columns={getAutorTableColumns()} shown={showColumn} setShown={setShowColumn}/>
            </div>
            <ServerPaginationTable
                title={`Autori (${countAll})`}
                data={autors}
                columns={getAutorTableColumns()}
                pageChange={(page) => setPagination(prevState => ({...prevState, page: page}))}
                pageSizeChange={handlePageSizeChange}
                sortingChange={(sorting) => setPagination(prevState => ({...prevState, sorting: sorting}))}
                totalCount={countAll}
                loading={loading}
                pagination={pagination}
                hiddenCols={showColumn}
                actions={
                    <div className="tableActionsRight">
                        <div className="searchTableWrapper">
                            <input
                                className="form-control"
                                style={{paddingRight: "2rem"}}
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
                rowActions={(_id, expandRow) => (
                    isUserLoggedIn() ? <div className="actionsRow" style={{pointerEvents: "auto"}}>
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
                    </div> : <></>
                )}
                expandedElement={(data) => <AutorDetail data={data}/>}
            />
            {Boolean(updateAutor) &&
                <AddAutor
                    saveAutor={handleSaveAutor}
                    autor={updateAutor}
                    onClose={() => setUpdateAutor(undefined)}
                    saveResultSuccess={saveAutorSuccess}
                />}
        </Layout>
    )
}
