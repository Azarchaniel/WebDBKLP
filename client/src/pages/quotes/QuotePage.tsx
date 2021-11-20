import Sidebar from "../../components/Sidebar";
import {Link} from "react-router-dom";
import AddQuote from "../../components/AddQuote";
import {IQuote} from "../../type";
import QuoteItem from "../../components/QuoteItem";
import Toast from "../../components/Toast";
import React, {useEffect, useState} from "react";
import {addQuote, deleteQuote, getQuotes} from "../../API";
import {toast} from "react-toastify";
import {confirmAlert} from "react-confirm-alert";

export default function QuotePage() {
    const [quotes, setQuotes] = useState<IQuote[]>([]);

    useEffect(() => {
        fetchQuotes();
    }, [])

    // ### QUOTES ###
    const fetchQuotes = (): void => {
        getQuotes()
            .then(({ data: { quotes } }: IQuote[] | any) => {
                setQuotes(quotes);
            })
            .catch((err: Error) => console.trace(err))
    }

    const handleSaveQuote = (e: React.FormEvent, formData: IQuote): void => {
        e.preventDefault()
        addQuote(formData)
            .then(({status, data}) => {
                if (status !== 201) {
                    throw new Error('Citat sa nepodarilo pridať!')
                }
                toast.success(`Citat bol úspešne pridaný.`);
                setQuotes(data.quotes);
            })
            .catch((err) => {
                toast.error(`Citat sa nepodarilo pridať!`);
                console.trace(err);
            })
    }

    const handleUpdateQuote = (): any => {}

    const handleDeleteQuote = (_id: string): void => {
        confirmAlert({
            title: 'Vymazat citat?',
            message: `Naozaj chceš vymazať citat?`,
            buttons: [
                {
                    label: 'Ano',
                    onClick: () => {
                        deleteQuote(_id)
                            .then(({ status, data }) => {
                                if (status !== 200) {
                                    throw new Error('Error! Quote not deleted')
                                }
                                toast.success(`Citat bol úspešne vymazaný.`);
                                setQuotes(data.quotes)
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

            <AddQuote saveQuote={handleSaveQuote} />

            {quotes?.map((quote: IQuote) => {
                if (quote.isDeleted) return null;
                return <QuoteItem
                    key={quote._id}
                    updateQuote={handleUpdateQuote}
                    deleteQuote={handleDeleteQuote}
                    quote={quote}
                />
            })}
            <Toast />
        </main>
    )
}