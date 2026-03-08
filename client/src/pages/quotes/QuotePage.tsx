import { IBook, IQuote } from "../../type";
import QuoteItem from "./QuoteItem";
import React, { useEffect, useState } from "react";
import { addQuote, deleteQuote, getQuotes } from "../../API";
import { toast } from "react-toastify";
import { generateColors, getRandomShade, ScrollToTopBtn, fetchQuotedBooks } from "@utils";
import { LoadingBooks } from "@components/LoadingBooks";
import { useReadLocalStorage } from "usehooks-ts";
import { openConfirmDialog } from "@components/ConfirmDialog";
import { LazyLoadMultiselect } from "@components/inputs";
import "@styles/QuotePage.scss";
import { useAuth } from "@utils/context";
import { useQuoteModal } from "@components/quotes/useQuoteModal";
import { useTranslation } from "react-i18next";

interface QuoteGroup {
    bookId: string;
    quotes: IQuote[];
    baseColor: string;
}

export default function QuotePage() {
    const { t } = useTranslation();
    const { isLoggedIn, currentUser } = useAuth();
    const [books, setBooks] = useState<IBook[]>([]);
    const [booksToFilter, setBooksToFilter] = useState<IBook[]>([]);
    const [filteredQuotes, setFilteredQuotes] = useState<IQuote[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
    const activeUser = useReadLocalStorage("activeUsers") as string[];
    const [loading, setLoading] = useState(true);
    const [saveQuoteSuccess, setSaveQuoteSuccess] = useState<boolean | undefined>(undefined);
    const [quoteGroups, setQuoteGroups] = useState<QuoteGroup[]>([]);
    const { openQuoteModal } = useQuoteModal();

    useEffect(() => {
        fetchQuotes();
    }, [activeUser, currentUser]);

    useEffect(() => {
        groupQuotesByBook();
    }, [filteredQuotes]);

    const groupQuotesByBook = () => {
        if (!filteredQuotes || !Array.isArray(filteredQuotes)) {
            setQuoteGroups([]);
            return;
        }

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

    const fetchQuotes = (books?: string[]): void => {
        setLoading(true);

        getQuotes(books, activeUser)
            .then(({ data: { quotes, count, onlyQuotedBooks } }: IQuote[] | any) => {
                setFilteredQuotes(quotes);
                setCountAll(count);
                //only overwrite books if this is init call
                if (!books) setBooks(onlyQuotedBooks);
            })
            .catch((err: Error) => console.trace(err))
            .finally(() => setLoading(false))
    }

    const handleSaveQuote = (formData: IQuote): void => {
        setSaveQuoteSuccess(undefined);
        const isNewQuote = !formData._id;

        addQuote(formData)
            .then(({ status, data }) => {
                if (status !== 201) {
                    throw new Error(t("quotes.saveError", { action: t("quotes.actionAdded") }))
                }
                setSaveQuoteSuccess(true);
                if (data?.quotes && Array.isArray(data.quotes)) {
                    setFilteredQuotes(data.quotes);
                } else {
                    // If quotes aren't returned, refetch them
                    fetchQuotes();
                }
                toast.success(t("quotes.saveSuccess", {
                    action: !isNewQuote ? t("quotes.actionEdited") : t("quotes.actionAdded")
                }));
            })
            .catch((err) => {
                toast.error(t("quotes.saveError", {
                    action: !isNewQuote ? t("quotes.actionEdited") : t("quotes.actionAdded")
                }));
                console.trace(err);
                setSaveQuoteSuccess(false);
            })
    }

    const handleDeleteQuote = (_id: string): void => {
        openConfirmDialog({
            text: t("quotes.deleteConfirm"),
            title: t("quotes.deleteTitle"),
            onOk: () => {
                deleteQuote(_id)
                    .then(res => {
                        if (res.status !== 200) {
                            throw new Error("Error! Quote not deleted")
                        }
                        toast.success(t("quotes.deleteSuccess"));
                        fetchQuotes();
                    })
                    .catch((err) => {
                        toast.error(t("quotes.deleteError"));
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

    // Handle the add quote button click
    const handleAddQuote = () => {
        setSaveQuoteSuccess(undefined);
        openQuoteModal(undefined, handleSaveQuote, saveQuoteSuccess);
    };

    return (
        <>
            {isLoggedIn && (
                <button
                    type="button"
                    className="addQuote"
                    onClick={handleAddQuote}
                    data-tip={t("quotes.add")}
                />
            )}
            <div>
                {loading ? <LoadingBooks /> : <></>}
            </div>
            <div className="p-4">
                <div className="headerTitleAction">
                    <h4 className="ml-4 mb-3" style={{ color: "black" }}>{t("quotes.title", { count: countAll })}</h4>
                </div>
                <div className="quoteBookSearch">
                    <LazyLoadMultiselect
                        value={booksToFilter}
                        onSearch={(query: string, page: number) =>
                            fetchQuotedBooks(query, page, books.map((book: IBook) => book._id))
                        }
                        displayValue="showName"
                        placeholder={t("quotes.fromBookPlaceholder")}
                        onChange={({ value }) => updateFilteredBooks(value as IBook[])}
                        name="fromBook"
                    />
                </div>
                <div className="quote_container">
                    {quoteGroups.length > 0 ? (
                        <>
                            {quoteGroups.map((group) => (
                                <React.Fragment key={group.bookId}>
                                    {group.quotes.map((quote) => (
                                        <QuoteItem
                                            key={quote._id}
                                            deleteQuote={handleDeleteQuote}
                                            saveQuote={handleSaveQuote}
                                            quote={quote}
                                            bcgrClr={getRandomShade(group.baseColor)}
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                        </>
                    ) : (
                        <span style={{ color: "black" }}>{t("quotes.noneFound")}</span>
                    )}
                </div>
            </div>
            <ScrollToTopBtn scrollToTop={scrollToTopOfPage} />
        </>
    )
}