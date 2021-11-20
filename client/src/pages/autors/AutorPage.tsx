import AddAutor from "./AddAutor";
import React, {useEffect, useState} from "react";
import {IAutor} from "../../type";
import AutorItem from "./AutorItem";
import {addAutor, deleteAutor, getAutor, getAutors} from "../../API";
import {toast} from "react-toastify";
import {confirmAlert} from "react-confirm-alert";
import Sidebar from "../../components/Sidebar";
import {Link} from "react-router-dom";
import Toast from "../../components/Toast";

export default function AutorPage() {
    const [autors, setAutors] = useState<IAutor[]>([]);

    useEffect(() => {
        fetchAutors();
    }, [])

    // ### AUTORS ###
    const fetchAutors = (): void => {
        getAutors()
            .then(({data: {autors}}: IAutor[] | any) => {
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

    const handleUpdateAutor = (): any => {
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
            <Sidebar />
            <h1><Link className='customLink' to='/'>WebDBKLP</Link></h1>

            <AddAutor saveAutor={handleSaveAutor}/>
            {autors.sort((a, b) => a.lastName.localeCompare(b.lastName)).map((autor: IAutor) => {
                if (autor?.isDeleted) return null;
                return <AutorItem
                    key={autor._id}
                    updateAutor={handleUpdateAutor}
                    deleteAutor={handleDeleteAutor}
                    autor={autor}
                />
            })}
            <Toast />
        </main>
    )
}