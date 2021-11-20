import Sidebar from "../../components/Sidebar";
import {Link} from "react-router-dom";
import AddLP from "./AddLP";
import {ILP} from "../../type";
import LPItem from "./LPItem";
import Toast from "../../components/Toast";
import React, {useEffect, useState} from "react";
import {addLP, deleteLP, getLPs} from "../../API";
import {toast} from "react-toastify";
import {confirmAlert} from "react-confirm-alert";

export default function LPPage() {
    const [lps, setLPs] = useState<ILP[]>([]);

    useEffect(() => {
        fetchLPs();
    }, [])

    // ### QUOTES ###
    const fetchLPs = (): void => {
        getLPs()
            .then(({ data: { lps } }: ILP[] | any) => {
                setLPs(lps);
            })
            .catch((err: Error) => console.trace(err))
    }

    const handleSaveLP = (e: React.FormEvent, formData: ILP): void => {
        e.preventDefault()
        addLP(formData)
            .then(({status, data}) => {
                if (status !== 201) {
                    throw new Error('LP sa nepodarilo pridať!')
                }
                toast.success(`LP bolo úspešne pridaný.`);
                setLPs(data.lps);
            })
            .catch((err) => {
                toast.error(`LP sa nepodarilo pridať!`);
                console.trace(err);
            })
    }

    const handleUpdateLP = (): any => {}

    const handleDeleteLP = (_id: string): void => {
        confirmAlert({
            title: 'Vymazat LP?',
            message: `Naozaj chceš vymazať LP?`,
            buttons: [
                {
                    label: 'Ano',
                    onClick: () => {
                        deleteLP(_id)
                            .then(({ status, data }) => {
                                if (status !== 200) {
                                    throw new Error('Error! LP not deleted')
                                }
                                toast.success(`LP bolo úspešne vymazaný.`);
                                setLPs(data.lps)
                            })
                            .catch((err) => {
                                toast.error('Došlo k chybe!');
                                console.trace(err);
                            })
                    }
                },
                {
                    label: 'Ne',
                    onClick: () => {}
                }
            ],
        });
    }

    return (
        <main className='App'>
            <Sidebar />
            <h1><Link className='customLink' to='/'>WebDBKLP</Link></h1>

            <AddLP saveLp={handleSaveLP} />

            {lps?.map((lp: ILP) => {
                if (lp.isDeleted) return null;
                return <LPItem
                    key={lp._id}
                    updateLP={handleUpdateLP}
                    deleteLP={handleDeleteLP}
                    lp={lp}
                />
            })}
            <Toast />
        </main>
    )
}