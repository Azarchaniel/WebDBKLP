import Sidebar from "../../components/Sidebar";
import AddLP from "./AddLP";
import {IBook, ILP} from "../../type";
import Toast from "../../components/Toast";
import React, {useEffect, useRef, useState} from "react";
import {addLP, deleteLP, getLPs} from "../../API";
import {toast} from "react-toastify";
import {confirmAlert} from "react-confirm-alert";
import {shortenStringKeepWord, stringifyAutors} from "../../utils/utils";
import MaterialTableCustom from "../../components/MaterialTableCustom";
import Header from "../../components/AppHeader";
import { tableHeaderColor } from "../../utils/constants";
import { ShowHideRow } from "../../components/books/ShowHideRow";

export default function LPPage() {

    const [LPs, setLPs] = useState<ILP[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
    const [hidden, setHidden] = useState({
        control: true,
        subtitle: true,
        createdAt: true
    });
    const popRef = useRef(null);

    useEffect(() => {
        fetchLPs();
    }, [])

    useEffect(() => {
        //todo: maybe separate to utils
        function handleClickOutside(event: Event) {
            if (popRef.current && !(popRef as any).current.contains(event.target)) {
                //prevState, otherwise it was overwritting the checkboxes
                setHidden(prevState => ({
                    ...prevState,
                    control: true
                }));
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [popRef]);

    // ### QUOTES ###
    const fetchLPs = (): void => {
        getLPs()
            .then(({ data: { lps, count } }: ILP[] | any) => {
                setLPs(stringifyAutors(lps));
                setCountAll(count);
            })
            .catch((err: Error) => console.trace(err))
    }

    const handleSaveLP = (formData: ILP): void => {
        addLP(formData)
            .then(({status, data}) => {
                if (status !== 201) {
                    throw new Error('LP sa nepodarilo pridať!')
                }
                toast.success(`LP bolo úspešne pridaný.`);
                setLPs(stringifyAutors(data.lps));
            })
            .catch((err) => {
                toast.error(`LP sa nepodarilo pridať!`);
                console.trace(err);
            })
    }

    const handleUpdateLP = (lp: ILP): any => {
        console.log(lp)
    }

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
                                setLPs(stringifyAutors(data.lps));
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
            <Header/>
            <Sidebar />
            <AddLP saveLp={handleSaveLP} />
            <div ref={popRef} className={`showHideColumns ${hidden.control ? 'hidden' : 'shown'}`}>
                <ShowHideRow label="Podnázov" init={hidden.subtitle} onChange={() => setHidden({...hidden, subtitle: !hidden.subtitle})} />
                <ShowHideRow label="Dátum pridania" init={hidden.createdAt} onChange={() => setHidden({...hidden, createdAt: !hidden.createdAt})} />
            </div>
            <MaterialTableCustom
                title={`LP (${countAll})`}
                columns={[
                    {
                        title: 'Autor',
                        field: 'autorsFull',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                    },
                    {
                        title: 'Názov',
                        field: 'title',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        cellStyle: {
                            fontWeight: "bold"
                        }
                    },
                    {
                        title: 'Podnázov',
                        field: 'subtitle',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        hidden: hidden.subtitle
                    },
                    {
                        title: 'ISBN',
                        field: 'ISBN',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        }
                    },
                    {
                        title: 'Jazyk',
                        field: 'language',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        }
                    },
                    {
                        title: 'Poznámka',
                        field: 'note',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        render: (rowData: IBook) => {
                            if (rowData.note) return shortenStringKeepWord(rowData.note, 30);
                        },
                    },
                    {
                        title: 'Počet strán',
                        field: 'numberOfPages',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        }
                    },
                    {
                        title: 'Pridané',
                        field: 'createdAt',
                        type: 'date',
                        dateSetting: {locale: "sk-SK"},
                        hidden: hidden.createdAt,
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        }
                    }
                ]}
                data={LPs}
                actions={[
                    {
                        icon: 'visibility',
                        tooltip: 'Zobraz/Skry stĺpce',
                        onClick: () => {
                            setHidden({...hidden, control: !hidden.control})
                        },
                        isFreeAction: true,
                    },
                    {
                        icon: 'create',
                        tooltip: 'Upraviť',
                        onClick: (_: any, rowData: unknown) => handleUpdateLP(rowData as ILP),
                    },
                    {
                        icon: 'delete',
                        tooltip: 'Vymazať',
                        onClick: (_: any, rowData: unknown) => handleDeleteLP((rowData as ILP)._id),
                    }
                ]}
            />
            <Toast />
        </main>
    )
}