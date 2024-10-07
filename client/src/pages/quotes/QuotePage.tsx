import Sidebar from "../../components/Sidebar";
import AddQuote from "./AddQuote";
import {IBook, IQuote, IUser} from "../../type";
import QuoteItem from "./QuoteItem";
import Toast from "../../components/Toast";
import React, {useEffect, useState} from "react";
import {addQuote, deleteQuote, getBooks, getQuotes} from "../../API";
import {toast} from "react-toastify";
import {confirmAlert} from "react-confirm-alert";
import {darkenLightenColor} from "../../utils/utils";
import Header from "../../components/AppHeader";
import LoadingBooks from "../../components/LoadingBooks";
import Multiselect from "multiselect-react-dropdown";
import { useReadLocalStorage } from "usehooks-ts";
import { ScrollToTopBtn } from "../../utils/elements";

export default function QuotePage() {
    const [books, setBooks] = useState<IBook[]>([]);
    const [booksToFilter, setBooksToFilter] = useState<string[]>([]);
    const [initQuotes, setInitQuotes] = useState<IQuote[]>([]);
    const [filteredQuotes, setFilteredQuotes] = useState<IQuote[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
    const activeUser = useReadLocalStorage("activeUsers");

    const [loading, setLoading] = useState(true);

    let colors = ['#77dd77', '#836953', '#89cff0', '#99c5c4', '#9adedb', '#aa9499', '#aaf0d1', '#b2fba5', '#b39eb5', '#bdb0d0',
        '#bee7a5', '#befd73', '#c1c6fc', '#c6a4a4', '#c8ffb0', '#cb99c9', '#cef0cc', '#cfcfc4', '#d8a1c4', '#dea5a4', '#deece1',
        '#dfd8e1', '#e5d9d3', '#e9d1bf', '#f49ac2', '#f4bfff', '#fdfd96', '#ff6961', '#ff964f', '#ff9899', '#ffb7ce', '#ca9bf7'];

    useEffect(() => {
        getBooks()
            .then(({ data: { books } }: IBook[] | any) => {
                setBooks(books);
            })
            .catch((err: Error) => console.trace(err))
        fetchQuotes();
    }, []);

    useEffect(() => {
        fetchQuotes();
    }, [activeUser]);

    // ### QUOTES ###
    const fetchQuotes = (): void => {
        setLoading(true);
        getQuotes()
            .then(({ data: { quotes, count } }: IQuote[] | any) => {
                if ((activeUser as string[])?.length) {
                    const quotesArr: IQuote[] = [];
                    quotes.forEach((qoute: IQuote) => {
                        //TODO: this filtering should be on BE
                        qoute.owner?.filter((owner: IUser) => {
                            if ((activeUser as string[]).includes(owner._id) || qoute.owner === undefined) {
                                quotesArr.push(qoute);
                            }
                        })
                    })
                    quotes = quotesArr;
                }
                setInitQuotes(quotes);
                setFilteredQuotes(quotes);
                setCountAll(count);
            })
            .catch((err: Error) => console.trace(err))
            .finally(() => setLoading(false))
    }

    useEffect(() => {     
        if (!booksToFilter.length) return setFilteredQuotes(initQuotes);

        let filteredQuotes = initQuotes.filter((quote: IQuote) => {
            if (!quote.fromBook) return;
            return booksToFilter.includes(quote.fromBook._id);
        })
        
        setFilteredQuotes(filteredQuotes);

    }, [booksToFilter]);

    const handleSaveQuote = (e: React.FormEvent, formData: IQuote): void => {
        e.preventDefault()
        addQuote(formData)
            .then(({status}) => {
                if (status !== 201) {
                    throw new Error('Citát sa nepodarilo pridať!')
                }
                toast.success(`Citát bol úspešne pridaný.`);
                refresh();
            })
            .catch((err) => {
                toast.error(`Citát sa nepodarilo pridať!`);
                console.trace(err);
            })
    }

    const handleDeleteQuote = (_id: string): void => {
        confirmAlert({
            title: 'Vymazať citát?',
            message: `Naozaj chceš vymazať citát?`,
            buttons: [
                {
                    label: 'Ano',
                    onClick: () => {
                        deleteQuote(_id)
                            .then(res => {
                                console.log(res.data.quotes)
                                if (res.status !== 200) {
                                    throw new Error('Error! Quote not deleted')
                                }
                                toast.success(`Citát bol úspešne vymazaný.`);
                                refresh();
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

    const getRndColor = () => {
        while (colors.length < initQuotes.length) {
            // if there are more quotes than colors, duplicate arr of colors, but randomly change shade of a color by +- 40 perc
            colors = colors.flatMap((item: string) => [item, darkenLightenColor(item, Math.round(Math.random()) ? 40 : -40)]);
        }
        let toChooseFrom = colors.slice(0, initQuotes.length);
        const choosenColor = toChooseFrom[Math.floor(Math.random() * toChooseFrom.length)];
        //when you pick a color, remove it from list
        colors = colors.filter((item: string) => choosenColor !== item);

        return choosenColor;
    }

    const scrollToTopOfPage = () => {
        window.scroll(0,0)
    }

    const refresh = () => {
        setInitQuotes([]);
        fetchQuotes();
    }

    return (
        <main className='App'>
            <Header/>
            <Sidebar />
            <AddQuote saveQuote={handleSaveQuote}/>
            <div style={{position: "fixed", top: "20rem", zIndex: 1000}}>
                {loading ? <LoadingBooks /> : <></>}
            </div>
            <h6 className="h6MaterialClone">Citáty ({countAll})</h6>
            <Multiselect
                closeOnSelect={true}
                options={books}
                displayValue="title"
                placeholder="Z knih"
                closeIcon="cancel"
                onSelect={(_: any, added: IBook) => {
                    //first param is list already selected Objects
                    setBooksToFilter([...booksToFilter, added._id])
                }}
                onRemove={
                    (remaining: IBook[]) => {
                        setBooksToFilter(remaining.map((book: IBook) => book._id))
                    }
                }
                style={{
                    inputField: {paddingLeft: "0.5rem"},
                    searchBox: {
                        width: "20rem",
                        paddingRight: '5px',
                        borderRadius: '3px'
                    },
                    option: {
                        color: "black"
                    },
                    multiselectContainer: {
                        width: "20rem",
                        paddingRight: '5px',
                        marginLeft: '.5rem',
                    }
                }}
            />
            <div className="quote_container">
                {
                    filteredQuotes.length ?
                        filteredQuotes?.map((quote: IQuote) => {
                            return <QuoteItem
                                key={quote._id}
                                deleteQuote={handleDeleteQuote}
                                saveQuote={handleSaveQuote}
                                quote={quote}
                                bcgrClr={getRndColor()}
                            />}) :
                            <span style={{color: 'black'}}>Žiadne citáty neboli nájdené!</span>
            }
            </div>
            <ScrollToTopBtn scrollToTop={() => scrollToTopOfPage()} />
            <Toast />
        </main>
    )
}