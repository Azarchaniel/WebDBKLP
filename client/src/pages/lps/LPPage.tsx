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
import Header from "../../components/Header";

export default function LPPage() {

    const [LPs, setLPs] = useState<ILP[]>([]);
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
            .then(({ data: { lps } }: ILP[] | any) => {
                lps = lps.filter((lp: ILP) => lp.deletedAt);
                setLPs(stringifyAutors(lps));
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
                <p>
                    <label>
                        <input type='checkbox'
                               checked={hidden.subtitle}
                               onChange={() => setHidden({...hidden, subtitle: !hidden.subtitle})}
                        />
                        Podnázov
                    </label>
                </p>
                <p>
                    <label>
                        <input type='checkbox'
                               checked={hidden.createdAt}
                               onChange={() => setHidden({...hidden, createdAt: !hidden.createdAt})}
                        />
                        Dátum pridania
                    </label>
                </p>
            </div>
            <MaterialTableCustom
                title="LP"
                columns={[
                    {
                        title: 'Autor',
                        field: 'autorsFull',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        },
                    },
                    {
                        title: 'Názov',
                        field: 'title',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        },
                        cellStyle: {
                            fontWeight: "bold"
                        }
                    },
                    {
                        title: 'Podnázov',
                        field: 'subtitle',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        },
                        hidden: hidden.subtitle
                    },
                    {
                        title: 'ISBN',
                        field: 'ISBN',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        }
                    },
                    {
                        title: 'Jazyk',
                        field: 'language',
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
                        render: (rowData: IBook) => {
                            if (rowData.note) return shortenStringKeepWord(rowData.note, 30);
                        },
                    },
                    {
                        title: 'Počet strán',
                        field: 'numberOfPages',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        }
                    },
                    {
                        title: 'Pridané',
                        field: 'createdAt',
                        type: 'date',
                        dateSetting: {locale: "sk-SK"},
                        hidden: hidden.createdAt,
                        headerStyle: {
                            backgroundColor: '#bea24b'
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