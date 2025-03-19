import AddAutor from "./AddAutor";
import React, {useEffect, useState} from "react";
import {IAutor} from "../../type";
import {addAutor, deleteAutor, getAutor, getAutors} from "../../API";
import {toast} from "react-toastify";
import Sidebar from "../../components/Sidebar";
import Toast from "../../components/Toast";
import {stringifyAutors} from "../../utils/utils";
import Header from "../../components/AppHeader";
import {DEFAULT_PAGINATION} from "../../utils/constants";
import {openConfirmDialog} from "../../components/ConfirmDialog";
import {isUserLoggedIn} from "../../utils/user";
import {getAutorTableColumns} from "../../utils/tableColumns";
import ServerPaginationTable from "../../components/table/TableSP";
import AutorDetail from "./AutorDetail";
import {SortingState} from "@tanstack/react-table";

export default function AutorPage() {
    const [autors, setAutors] = useState<IAutor[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [updateAutor, setUpdateAutor] = useState<IAutor>();
    const [pagination, setPagination] = useState({...DEFAULT_PAGINATION, sorting: [{id: "lastName", desc: false}] as SortingState});
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [saveAutorSuccess, setSaveAutorSuccess] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        fetchAutors();
    }, [])

    useEffect(() => {
        if (!timeoutId || pagination.search === "") return fetchAutors();
        if (timeoutId) clearTimeout(timeoutId);

        const newTimeoutId = setTimeout(() => {
            fetchAutors();
        }, 1000); // Wait 1s before making the request

        setTimeoutId(newTimeoutId);
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

    const handleDeleteAutor = (_id: string): void => {
        let autorToDelete = autors.find((autor: IAutor) => autor._id === _id);

        if (!autorToDelete) {
            getAutor(_id)
                .then(({data}) => {
                    autorToDelete = data.autor;
                })
                .catch((err) => console.trace(err))
        }

        openConfirmDialog({
            title: "Vymazať autora?",
            text: `Naozaj chceš vymazať autora ${autorToDelete?.fullName}?`,
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
            onCancel: () => {}
        });
    }

    const handlePageSizeChange = (newPageSize: number) => {
        const newPage = Math.floor(((pagination.page - 1) * pagination.pageSize) / newPageSize) + 1;
        setPagination(prevState => ({...prevState, page: newPage, pageSize: newPageSize}));
    };

    return (
        <main className='App'>
            {/* TODO: remove Header and Sidebar from here */}
            <Header/>
            <Sidebar/>
            {isUserLoggedIn() && <AddAutor saveAutor={handleSaveAutor} onClose={() => setUpdateAutor(undefined)}/>}
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
                actions={
                    <div className="row justify-center mb-4 mr-2">
                        <div className="searchTableWrapper">
                            {/* reset pagination on search*/}
                            <input
                                className="form-control"
                                style={{paddingRight: "2rem"}}
                                placeholder="Vyhľadaj autora"
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
            <Toast/>
        </main>
    )
}
