import { IBook, IQuote } from "../../type";
import QuoteItem from "./QuoteItem";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addQuote, deleteQuote, getQuotes } from "../../API";
import { toast } from "react-toastify";
import { generateColors, getRandomShade, ScrollToTopBtn } from "@utils";
import { LoadingBooks } from "@components/LoadingBooks";
import LoadingSpinner from "@components/LoadingSpinner";
import { useReadLocalStorage, useDebounceValue } from "usehooks-ts";
import { openConfirmDialog } from "@components/ConfirmDialog";
import { InputField, LazyLoadMultiselect } from "@components/inputs";
import "@styles/QuotePage.scss";
import { useAuth } from "@utils/context";
import { useQuoteModal } from "@components/quotes/useQuoteModal";
import { useTranslation } from "react-i18next";

const PAGE_LIMIT = 20;

interface QuoteGroup {
    bookId: string;
    quotes: IQuote[];
    baseColor: string;
    quoteColors: Map<string, string>;
}

interface QuoteBookOption {
    _id: string;
    showName: string;
}

const toQuoteBookOption = (book: IBook): QuoteBookOption => ({
    _id: book._id,
    showName: `${book.title}
                        ${book.autor && book.autor[0] && book.autor[0].firstName ? "/ " + book.autor[0].firstName : ""}
                        ${book.autor && book.autor[0] && book.autor[0].lastName ? book.autor[0].lastName : ""}
                        ${book.published && book.published?.year ? "/ " + book.published?.year : ""}`
});

export default function QuotePage() {
    const { t } = useTranslation();
    const { isLoggedIn, currentUser } = useAuth();
    const [books, setBooks] = useState<QuoteBookOption[]>([]);
    const [booksToFilter, setBooksToFilter] = useState<QuoteBookOption[]>([]);
    const [filteredQuotes, setFilteredQuotes] = useState<IQuote[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
    const activeUser = useReadLocalStorage("activeUsers") as string[];
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);
    const [searchText, setSearchText] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useDebounceValue("", 400);
    const [saveQuoteSuccess, setSaveQuoteSuccess] = useState<boolean | undefined>(undefined);
    const { openQuoteModal } = useQuoteModal();
    const sentinelRef = useRef<HTMLDivElement>(null);
    // Stable quote-id → color map; never resets so colors don't flash on re-render
    const quoteColorMapRef = useRef<Map<string, string>>(new Map());

    // Refs so the IntersectionObserver callback always sees the latest state
    const loadingRef = useRef(true);
    const loadingMoreRef = useRef(false);
    const hasMoreRef = useRef(false);
    loadingRef.current = loading;
    loadingMoreRef.current = loadingMore;
    hasMoreRef.current = hasMore;

    const quoteGroups = useMemo<QuoteGroup[]>(() => {
        if (!filteredQuotes || !Array.isArray(filteredQuotes)) return [];
        const groups: { [bookId: string]: QuoteGroup } = {};
        const baseColors = generateColors(books.length);
        let colorIndex = 0;
        filteredQuotes.forEach((quote) => {
            const bookId = quote.fromBook?._id;
            if (!bookId) return;
            if (!groups[bookId]) {
                groups[bookId] = {
                    bookId,
                    quotes: [],
                    baseColor: baseColors[colorIndex++ % baseColors.length],
                    quoteColors: new Map(),
                };
            }
            // Assign a shade once per quote and keep it stable across re-renders
            if (!quoteColorMapRef.current.has(quote._id)) {
                quoteColorMapRef.current.set(
                    quote._id,
                    getRandomShade(groups[bookId].baseColor)
                );
            }
            groups[bookId].quoteColors.set(quote._id, quoteColorMapRef.current.get(quote._id)!);
            groups[bookId].quotes.push(quote);
        });
        return Object.values(groups);
    }, [filteredQuotes, books]);

    const doFetch = useCallback((pageNum: number, bookIds: string[], search: string, users: string[] | null, isReset: boolean): void => {
        if (isReset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        getQuotes(
            bookIds.length ? bookIds : undefined,
            users ?? undefined,
            pageNum,
            PAGE_LIMIT,
            search.trim() || undefined
        )
            .then(({ data: { quotes, count, onlyQuotedBooks, hasMore: more } }) => {
                if (isReset) {
                    quoteColorMapRef.current.clear();
                    setFilteredQuotes(quotes);
                } else {
                    setFilteredQuotes(prev => [...prev, ...quotes]);
                }
                setCountAll(count ?? 0);
                setHasMore(more ?? false);
                if (pageNum === 1 && onlyQuotedBooks) {
                    setBooks(onlyQuotedBooks.map(toQuoteBookOption));
                }
            })
            .catch((err: Error) => console.trace(err))
            .finally(() => {
                if (isReset) {
                    setLoading(false);
                } else {
                    setLoadingMore(false);
                }
            });
        // doFetch only needs to be stable w.r.t. the setters, which are stable
    }, []);

    // Reset and re-fetch from page 1 when search, filters, or user changes
    useEffect(() => {
        setPage(1);
        doFetch(1, booksToFilter.map(b => b._id), debouncedSearch, activeUser, true);
    }, [debouncedSearch, booksToFilter, activeUser, currentUser]);

    // Load next page when page increments (page 1 is handled by the effect above)
    useEffect(() => {
        if (page === 1) return;
        doFetch(page, booksToFilter.map(b => b._id), debouncedSearch, activeUser, false);
    }, [page]);

    // Infinite scroll — watch the sentinel element
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasMoreRef.current &&
                    !loadingRef.current &&
                    !loadingMoreRef.current
                ) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, []);

    const handleSaveQuote = (formData: IQuote): void => {
        setSaveQuoteSuccess(undefined);
        const isNewQuote = !formData._id;

        addQuote(formData)
            .then(({ status }) => {
                if (status !== 201) {
                    throw new Error(t("quotes.saveError", { action: t("quotes.actionAdded") }));
                }
                setSaveQuoteSuccess(true);
                // Reset to page 1 to reflect the new/edited quote
                setPage(1);
                doFetch(1, booksToFilter.map(b => b._id), debouncedSearch, activeUser, true);
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
            });
    };

    const handleDeleteQuote = (_id: string): void => {
        openConfirmDialog({
            text: t("quotes.deleteConfirm"),
            title: t("quotes.deleteTitle"),
            onOk: () => {
                deleteQuote(_id)
                    .then(res => {
                        if (res.status !== 200) {
                            throw new Error("Error! Quote not deleted");
                        }
                        toast.success(t("quotes.deleteSuccess"));
                        setPage(1);
                        doFetch(1, booksToFilter.map(b => b._id), debouncedSearch, activeUser, true);
                    })
                    .catch((err) => {
                        toast.error(t("quotes.deleteError"));
                        console.trace(err);
                    });
            },
            onCancel: () => { }
        });
    };

    const scrollToTopOfPage = () => {
        window.scroll(0, 0);
    };

    const handleAddQuote = () => {
        setSaveQuoteSuccess(undefined);
        openQuoteModal(undefined, handleSaveQuote, saveQuoteSuccess);
    };

    const updateFilteredBooks = (selectedBooks: QuoteBookOption[]): void => {
        setBooksToFilter(selectedBooks);
    };

    return (
        <>
            {isLoggedIn && (
                <button
                    type="button"
                    className="addQuote"
                    onClick={handleAddQuote}
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("quotes.add")}
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
                    <div className="searchTableWrapper">
                        <InputField
                            type="text"
                            class="searchInput"
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                setDebouncedSearch(e.target.value);
                            }}
                            placeholder={t("quotes.searchPlaceholder")}
                        />
                        <div className="searchBtns">
                            <button
                                onClick={() => {
                                    setSearchText("");
                                    setDebouncedSearch("");
                                }}
                            >
                                ✖
                            </button>
                        </div>
                    </div>
                    <LazyLoadMultiselect
                        value={booksToFilter}
                        options={books}
                        displayValue="showName"
                        placeholder={t("quotes.fromBookPlaceholder")}
                        onChange={({ value }) => updateFilteredBooks(value as QuoteBookOption[])}
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
                                            bcgrClr={group.quoteColors.get(quote._id)!}
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                        </>
                    ) : (
                        !loading && <span style={{ color: "black" }}>{t("quotes.noneFound")}</span>
                    )}
                </div>
                <div ref={sentinelRef} className="quoteSentinel">
                    {loadingMore && (
                        <div className="quoteSentinel__spinner">
                            <LoadingSpinner color="#000" size={40} />
                        </div>
                    )}
                </div>
            </div>
            <ScrollToTopBtn scrollToTop={scrollToTopOfPage} />
        </>
    );
}
