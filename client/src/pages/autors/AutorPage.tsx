import AddAutor from "./AddAutor";
import React, {useEffect, useState} from "react";
import {IAutor} from "../../type";
import {addAutor, deleteAutor, getAutor, getAutors} from "../../API";
import {toast} from "react-toastify";
import {confirmAlert} from "react-confirm-alert";
import Sidebar from "../../components/Sidebar";
import {Link} from "react-router-dom";
import Toast from "../../components/Toast";
import MaterialTableCustom from "../../components/MaterialTableCustom";
import {shortenStringKeepWord} from "../../utils/utils";

export default function AutorPage() {
    const [autors, setAutors] = useState<IAutor[]>([]);

    useEffect(() => {
        fetchAutors();
    }, [])

    // ### AUTORS ###
    const fetchAutors = (): void => {
        getAutors()
            .then(({data: {autors}}: any) => {
                setAutors(autors);
            })
            .catch((err: Error) => console.trace(err))
    }

    const handleSaveAutor = (e: React.FormEvent, formData: IAutor): void => {
        e.preventDefault()
        addAutor(formData)
            .then(({status, data}) => {
                if (status !== 201) {
                    throw new Error('Autora sa nepodarilo pridať!')
                }
                const autorNames = `${data.autor?.lastName}${data.autor?.firstName ? ', ' + data.autor?.firstName : ''}`;
                toast.success(`Autor ${autorNames} bol úspešne pridaný.`);
                setAutors(data.autors);
            })
            .catch((err) => {
                toast.error(`Autora sa nepodarilo pridať!`);
                console.trace(err);
            })
    }

    const handleUpdateAutor = (autor: IAutor): any => {
        console.log('todo: update autor', autor);
    }

    const handleDeleteAutor = (_id: string): void => {
        getAutor(_id)
            .then(({status, data}) => {
                if (status !== 200) {
                    toast.error('Došlo k chybe!');
                    throw new Error('Chyba! Autor nebol vymazaný.')
                }
                const autorNames = `${data.autor?.lastName}${data.autor?.firstName ? ', ' + data.autor?.firstName : ''}`;

                confirmAlert({
                    title: 'Vymazat autora?',
                    message: `Naozaj chceš vymazať autora ${autorNames}?`,
                    buttons: [
                        {
                            label: 'Ano',
                            onClick: () => {
                                deleteAutor(_id)
                                    .then(({status, data}) => {
                                        if (status !== 200) {
                                            throw new Error('Error! Autor not deleted')
                                        }
                                        toast.success(`Autor ${autorNames} bol úspešne vymazaný.`);
                                        setAutors(data.autors)
                                    })
                                    .catch((err) => {
                                        toast.error('Došlo k chybe!');
                                        console.trace(err);
                                    })
                            }
                        },
                        {
                            label: 'Ne',
                            onClick: () => {
                            }
                        }
                    ],
                });
            })
            .catch((err) => console.trace(err))
    }

    return (
        <main className='App'>
            <Sidebar/>
            <h1><Link className='customLink' to='/'>WebDBKLP</Link></h1>
            <AddAutor saveAutor={handleSaveAutor}/>
            <MaterialTableCustom
                title="Autori"
                columns={[
                    {
                        title: 'Meno',
                        field: 'firstName',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        },
                    },
                    {
                        title: 'Priezvisko',
                        field: 'lastName',
                        defaultSort: 'asc',
                        customSort: (a: IAutor, b: IAutor) => a.lastName.localeCompare(b.lastName),
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        }
                    },
                    {
                        title: 'Národnosť',
                        field: 'nationality',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        }
                    },
                    {
                        title: 'Narodenie',
                        field: 'dateOfBirth',
                        type: 'date',
                        dateSetting: {locale: "sk-SK"},
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        }
                    },
                    {
                        title: 'Úmrtie',
                        field: 'dateOfDeath',
                        type: 'date',
                        dateSetting: {locale: "sk-SK"},
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        }
                    },
                    {
                        title: 'Poznámka',
                        field: 'note',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        },
                        render: (rowData: IAutor) => {
                            if (rowData.note) return shortenStringKeepWord(rowData.note, 30);
                        }
                    }
                ]}
                data={autors}
                actions={[
                    {
                        icon: 'create',
                        tooltip: 'Upraviť',
                        onClick: (_: any, rowData: unknown) => handleUpdateAutor(rowData as IAutor),
                    },
                    {
                        icon: 'delete',
                        tooltip: 'Vymazať',
                        onClick: (_: any, rowData: unknown) => handleDeleteAutor((rowData as IAutor)._id),
                    }
                ]}
                detailPanel={[
                    {
                        tooltip: 'Detaily',
                        render: (rowData: any) => {return (
                            <>
                                <pre>{JSON.stringify(rowData, undefined, 3)}</pre>
                            </>
                        )}
                    },
                ]}
                />
            <Toast/>
        </main>
    )
}