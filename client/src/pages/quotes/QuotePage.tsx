import Sidebar from "../../components/Sidebar";
import AddQuote from "./AddQuote";
import {IBook, IQuote} from "../../type";
import QuoteItem from "./QuoteItem";
import Toast from "../../components/Toast";
import React, {useEffect, useState} from "react";
import {addQuote, deleteQuote, getQuotes} from "../../API";
import {toast} from "react-toastify";
import {generateColors, getRandomShade} from "../../utils/utils";
import Header from "../../components/AppHeader";
import {LoadingBooks} from "../../components/LoadingBooks";
import {useReadLocalStorage} from "usehooks-ts";
import {ScrollToTopBtn} from "../../utils/elements";
import {openConfirmDialog} from "../../components/ConfirmDialog";
import {isUserLoggedIn} from "../../utils/user";
import {LazyLoadMultiselect} from "../../components/InputFields";
import {fetchQuotedBooks} from "../../utils/fetch";

interface QuoteGroup {
    bookId: string;
    quotes: IQuote[];
    baseColor: string;
}

export default function QuotePage() {
    const [books, setBooks] = useState<IBook[]>([]);
    const [booksToFilter, setBooksToFilter] = useState<IBook[]>([]);
    const [filteredQuotes, setFilteredQuotes] = useState<IQuote[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
    const activeUser = useReadLocalStorage("activeUsers") as string[];
    const [loading, setLoading] = useState(true);
    const [saveAutorSuccess, setSaveAutorSuccess] = useState<boolean | undefined>(undefined);
    const [quoteGroups, setQuoteGroups] = useState<QuoteGroup[]>([]);

    useEffect(() => {
        fetchQuotes();
    }, [activeUser]);

    useEffect(() => {
        groupQuotesByBook();
    }, [filteredQuotes]);

    const groupQuotesByBook = () => {
        const groups: { [bookId: string]: QuoteGroup } = {};
        const baseColors = generateColors(books.length);
        let colorIndex = 0;

        filteredQuotes.forEach((quote) => {
            const bookId = quote.fromBook?._id;
            if (!bookId) return;

            if (!groups[bookId]) {
                groups[bookId] = {
                    bookId: bookId,
                    quotes: [],
                    baseColor: baseColors[colorIndex++ % baseColors.length], // Assign a base color
                };
            }
            groups[bookId].quotes.push(quote);
        });

        setQuoteGroups(Object.values(groups));
    };

    const updateFilteredBooks = (books: IBook[]): void => {
        setBooksToFilter(books);
        fetchQuotes(books.map((book: IBook) => book._id));
    }

    // ### QUOTES ###
    const fetchQuotes = (books?: string[]): void => {
        setLoading(true);

        getQuotes(books, activeUser)
            .then(({data: {quotes, count, onlyQuotedBooks}}: IQuote[] | any) => {
                setFilteredQuotes(quotes);
                setCountAll(count);
                setBooks(onlyQuotedBooks);
            })
            .catch((err: Error) => console.trace(err))
            .finally(() => setLoading(false))
    }

    const handleSaveQuote = (formData: IQuote): void => {
        addQuote(formData)
            .then(({status}) => {
                if (status !== 201) {
                    throw new Error("Citát sa nepodarilo pridať!")
                }
                toast.success("Citát bol úspešne pridaný.");
                setSaveAutorSuccess(true);
            })
            .catch((err) => {
                toast.error("Citát sa nepodarilo pridať!");
                console.trace(err);
                setSaveAutorSuccess(false);
            })
    }

    const handleDeleteQuote = (_id: string): void => {
        openConfirmDialog({
            text: "Naozaj chceš vymazať citát?",
            title: "Vymazať citát?",
            onOk: () => {
                deleteQuote(_id)
                    .then(res => {
                        if (res.status !== 200) {
                            throw new Error("Error! Quote not deleted")
                        }
                        toast.success("Citát bol úspešne vymazaný.");
                    })
                    .catch((err) => {
                        toast.error("Chyba! Citát nemožno vymazať!");
                        console.trace(err);
                    });
            },
            onCancel: () => {
            }
        });
    }

    const scrollToTopOfPage = () => {
        window.scroll(0, 0)
    }

    return (
        <main className='App'>
            <Header/>
            <Sidebar/>
            {isUserLoggedIn() && <AddQuote saveQuote={handleSaveQuote} onClose={() => {
            }} saveResultSuccess={saveAutorSuccess}/>}
            <div>
                {loading ? <LoadingBooks/> : <></>}
            </div>
            <h6 className="h6MaterialClone">Citáty ({countAll})</h6>
            <div className="col-3">
                <LazyLoadMultiselect
                    value={booksToFilter}
                    onSearch={(query: string, page: number) =>
                        fetchQuotedBooks(query, page, books.map((book: IBook) => book._id))
                    }
                    displayValue="showName"
                    placeholder="Z knih"
                    onChange={({value}) => updateFilteredBooks(value as any)}
                    name="fromBook"
                />
            </div>
            <div className="quote_container">
                {quoteGroups.length > 0 ? (
                    quoteGroups.map((group) =>
                        group.quotes.map((quote) => (
                            <QuoteItem
                                key={quote._id}
                                deleteQuote={handleDeleteQuote}
                                saveQuote={handleSaveQuote}
                                quote={quote}
                                bcgrClr={getRandomShade(group.baseColor)} // Get a random shade
                            />
                        ))
                    )
                ) : (
                    <span style={{color: "black"}}>Žiadne citáty neboli nájdené!</span>
                )}
            </div>
            <ScrollToTopBtn scrollToTop={() => scrollToTopOfPage()}/>
            <Toast/>
        </main>
    )
}