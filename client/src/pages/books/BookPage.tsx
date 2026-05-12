import { IBook, IBookColumnVisibility, SaveEntity, SaveEntityResult } from "../../type";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { addBook, checkBooksUpdated, deleteBook, getBook, getBooks } from "../../API";
import { toast } from "react-toastify";
import {
    DEFAULT_PAGINATION,
    stringifyAutors,
    stringifyUsers,
    getBookTableColumns,
    ShowHideColumns,
    getCachedTimestamp,
    getCachedCollectionLatestUpdate,
    loadFirstPageFromCache,
    loadCollectionFromCache,
    saveFirstPageToCache,
    isMobile,
    shortenStringKeepWord,
    META_KEY_BOOKS,
} from "@utils";
import { useBookModal } from "@components/books/useBookModal";
import { openConfirmDialog } from "@components/ConfirmDialog";
import ServerPaginationTable from "@components/table/TableSP";
import BookDetail from "./BookDetail";
import "@styles/BookPage.scss";
import BarcodeScannerButton from "@components/BarcodeScanner";
import { useClickOutside, useOnlineStatus } from "@hooks";
import { useAuth } from "@utils/context";
import { InputField } from "@components/inputs";
import { useTranslation } from "react-i18next";

export default function BookPage() {
    const { t } = useTranslation();
    const { id } = useParams<{ id?: string }>();
    const { currentUser, isLoading: isAuthLoading, isLoggedIn, isGuest } = useAuth();
    const isOnline = useOnlineStatus();

    const [clonedBooks, setClonedBooks] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        page: DEFAULT_PAGINATION.page,
        pageSize: DEFAULT_PAGINATION.pageSize,
        search: id ?? DEFAULT_PAGINATION.search,
        sorting: [...DEFAULT_PAGINATION.sorting],
        filters: DEFAULT_PAGINATION.filters
    });
    const [countAll, setCountAll] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [showColumn, setShowColumn] = useState<IBookColumnVisibility>({
        control: false,
        autorsFull: true,
        editorsFull: false,
        ilustratorsFull: false,
        translatorsFull: !isMobile(),
        subtitle: false,
        content: false,
        dimensions: false,
        ISBN: true,
        language: false,
        numberOfPages: false,
        height: false,
        width: false,
        thickness: false,
        weight: false,
        edition: false,
        serie: false,
        published: !isMobile(),
        "published.publisher": !isMobile(),
        "published.year": !isMobile(),
        exLibris: !isMobile(),
        readBy: !isMobile(),
        note: !isMobile(),
        location: !isMobile(),
        ownersFull: !isMobile(),
        createdAt: false,
        updatedAt: !isMobile(),
    });
    const [saveBookSuccess, setSaveBookSuccess] = useState<boolean | undefined>(undefined);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const controllerRef = useRef<AbortController | null>(null);
    const [selectedBooks, setSelectedBooks] = useState<string[]>([]);

    const popRef = useRef<HTMLDivElement>(null);
    const exceptRef = useRef<HTMLDivElement>(null);

    useClickOutside(popRef, () => {
        setShowColumn(prevState => ({
            ...prevState,
            control: false
        }));
    }, exceptRef);

    const checkIfFirstPage = () => {
        return JSON.stringify(pagination) === JSON.stringify(DEFAULT_PAGINATION);
    }

    // ### BOOKS ###
    const fetchBooks = async (): Promise<void> => {
        try {
            // Abort previous request
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
            // Create new AbortController
            controllerRef.current = new AbortController();

            setLoading(true);

            // Shared helper: filter + sort + paginate from IndexedDB and set state.
            // Used for offline mode and as network-error fallback.
            const serveFromCache = async () => {
                // Try full background cache first (PWA mode — all books, supports search)
                const fullCache = await loadCollectionFromCache<IBook>('books', META_KEY_BOOKS);
                if (fullCache && fullCache.items.length > 0) {
                    const search = pagination.search?.trim().toLowerCase();
                    let filtered = search
                        ? fullCache.items.filter((b: any) =>
                            b.title?.toLowerCase().includes(search) ||
                            (b.autor as any[])?.some((a: any) =>
                                a.firstName?.toLowerCase().includes(search) ||
                                a.lastName?.toLowerCase().includes(search)
                            ) ||
                            b.ISBN?.toLowerCase().includes(search)
                        )
                        : fullCache.items;
                    const [sortInfo] = pagination.sorting ?? [];
                    const sortField = sortInfo?.id ?? 'title';
                    const sortDesc = sortInfo?.desc ?? false;
                    filtered = filtered.slice().sort((a: any, b: any) => {
                        const cmp = String(a[sortField] ?? '').localeCompare(String(b[sortField] ?? ''), undefined, { numeric: true });
                        return sortDesc ? -cmp : cmp;
                    });
                    const start = (pagination.page - 1) * pagination.pageSize;
                    const paged = filtered.slice(start, start + pagination.pageSize);
                    const processed = stringifyAutors(paged);
                    processed.forEach((book: any) => book["ownersFull"] = stringifyUsers(book.owner, false));
                    setCountAll(filtered.length);
                    setClonedBooks(processed);
                    return;
                }
                // Fall back to first-page cache (limited to ~50 books, no cross-page search)
                const cachedData = await loadFirstPageFromCache();
                if (cachedData) {
                    const [sortInfo] = pagination.sorting ?? [];
                    const sortField = sortInfo?.id ?? 'title';
                    const sortDesc = sortInfo?.desc ?? false;
                    const processed = stringifyAutors(cachedData.books);
                    processed.forEach((book: any) => book["ownersFull"] = stringifyUsers(book.owner, false));
                    processed.sort((a: any, b: any) => {
                        const cmp = String(a[sortField] ?? '').localeCompare(String(b[sortField] ?? ''), undefined, { numeric: true });
                        return sortDesc ? -cmp : cmp;
                    });
                    setCountAll(cachedData.count);
                    setClonedBooks(processed);
                }
            };

            // ── Offline: serve entirely from IndexedDB ────────────────────────────────────
            if (!navigator.onLine) {
                await serveFromCache();
                setLoading(false);
                return;
            }

            // ── Online: show first page from cache immediately (only if no full bg cache) ──
            // When bg cache is active, showing it immediately would flash all books then
            // snap to the server's page of 50 — skip the quick-display in that case.
            let servedFromCache = false;
            if (checkIfFirstPage()) {
                const hasBgCache = (await getCachedCollectionLatestUpdate(META_KEY_BOOKS)) !== null;
                if (!hasBgCache) {
                    const cachedData = await loadFirstPageFromCache();
                    if (cachedData) {
                        const [sortInfo] = pagination.sorting ?? [];
                        const sortField = sortInfo?.id ?? 'title';
                        const sortDesc = sortInfo?.desc ?? false;
                        const processed = stringifyAutors(cachedData.books);
                        processed.forEach((book: any) => book["ownersFull"] = stringifyUsers(book.owner, false));
                        processed.sort((a: any, b: any) => {
                            const cmp = String(a[sortField] ?? '').localeCompare(String(b[sortField] ?? ''), undefined, { numeric: true });
                            return sortDesc ? -cmp : cmp;
                        });
                        setCountAll(cachedData.count);
                        setClonedBooks(processed);
                        setLoading(false);
                        servedFromCache = true;
                    }
                }
            }

            // Check with server whether the cache is still current
            let needsFreshData = true;
            if (checkIfFirstPage() && servedFromCache) {
                try {
                    const { status } = await checkBooksUpdated(await getCachedTimestamp());
                    needsFreshData = status !== 204;
                } catch {
                    return; // Offline or unreachable — cached data already shown
                }
            }

            if (!needsFreshData) return;

            // Fetch fresh data from server (silently when cache was already shown)
            if (!servedFromCache) setLoading(true);
            getBooks({ ...pagination, signal: controllerRef.current.signal })
                .then(({ data: { books, count } }: IBook[] | any) => {
                    setCountAll(count);
                    const processedBooks = stringifyAutors(books);
                    processedBooks.map((book: any) => book["ownersFull"] = stringifyUsers(book.owner, false));
                    setClonedBooks(processedBooks);

                    // If this is first page without search, update the cache
                    if (checkIfFirstPage()) {
                        saveFirstPageToCache(books, count, pagination);
                    }
                    setLoading(false);
                })
                .catch(async (err: any) => {
                    if (
                        err?.name === 'AbortError' ||
                        err?.name === 'CanceledError' ||
                        err?.code === 'ERR_CANCELED' ||
                        err?.message?.includes('AbortError') ||
                        err?.message?.includes('canceled')
                    ) return;
                    // Network error — serve from IndexedDB cache (also applies search filter)
                    await serveFromCache();
                    setLoading(false);
                });
        } catch (err: any) {
            toast.error(err.response?.data?.error);
            console.error('Error fetching books:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (pagination.search === "") {
            timeoutRef.current = null;
            fetchBooks();
            return;
        }

        timeoutRef.current = setTimeout(() => {
            fetchBooks();
        }, 1000);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [pagination, currentUser, isAuthLoading]);

    const { openBookModal } = useBookModal();

    const handleSaveBook = async (formData: SaveEntity<IBook>): Promise<SaveEntityResult> => {
        setSaveBookSuccess(undefined);
        const isNewBook = Array.isArray(formData)
            ? formData.some((book) => !(book as IBook)._id)
            : !(formData as IBook)._id;

        try {
            const res = await addBook(formData);
            let message = "";
            if (Array.isArray(formData) && formData.length > 1) {
                message = t("books.saveManySuccess", { count: res.length });
            } else {
                const bookTitle = Array.isArray(res)
                    ? res[0].data.book?.title
                    : res.data.book?.title;
                message = t("books.saveSuccessSingle", {
                    title: bookTitle,
                    action: !isNewBook ? t("books.actionSaved") : t("books.actionAdded")
                });
            }
            toast.success(message, { autoClose: 3000 });
            setSaveBookSuccess(true);
            fetchBooks();
            return { success: true, message };
        } catch (err: any) {
            const message = err.response?.data?.error || t("books.saveError");
            toast.error(message);
            console.trace("Error saving books", err);
            setSaveBookSuccess(false);
            return { success: false, message };
        }
    };

    const handleUpdateBook = (_id?: string): void => {
        setSaveBookSuccess(undefined);

        if (_id) {
            const bookToUpdate = clonedBooks.find((book: IBook) => book._id === _id);

            if (bookToUpdate) {
                // Use the persistent modal for a single book
                openBookModal(
                    [bookToUpdate],
                    handleSaveBook,
                    saveBookSuccess
                );
            } else {
                getBook(_id)
                    .then(({ data }) => {
                        if (data.book) {
                            // Use the persistent modal for fetched book
                            openBookModal(
                                [data.book],
                                handleSaveBook,
                                saveBookSuccess
                            );
                        }
                    })
                    .catch((err) => {
                        toast.error(err.response.data.error || t("books.notFound"));
                        console.trace(err);
                    })
            }
            return;
        }
        if (selectedBooks.length > 0) {
            const selectedBooksData = clonedBooks.filter((book: IBook) => selectedBooks.includes(book._id));
            // Use the persistent modal for multiple selected books
            openBookModal(
                selectedBooksData,
                handleSaveBook,
                saveBookSuccess
            );
        }
    }

    const handleDeleteBook = (_id?: string): void => {
        const idsToDelete: string[] = [];

        if (selectedBooks.length > 0 && !selectedBooks.includes(_id!)) {
            // If specific _id is provided, or if we have selected books but the provided _id
            // is not among them, we delete only the specified _id
            idsToDelete.push(_id!);
        } else if (selectedBooks.length > 0) {
            // If no specific _id is provided but we have selected books,
            // or if the provided _id is already in the selection,
            // we delete all selected books
            idsToDelete.push(...selectedBooks);
        } else if (_id) {
            // If there's no selection but a specific _id is provided, we delete only that
            idsToDelete.push(_id);
        } else {
            // If there's no _id and no selection, show error
            toast.error(t("books.deleteSelectError"));
            return;
        }

        // Get book objects for confirmation dialog
        const booksToDelete = clonedBooks.filter((book: IBook) => idsToDelete.includes(book._id));

        const proceedDelete = (books: IBook[]) => {
            const titles = shortenStringKeepWord(books.map(b => b.title).join("\n "), 150);

            let message = "";
            if (books.length > 1) {
                message = t("books.deleteConfirmMany", { count: books.length }) + `\n\n ${titles}`;
            } else {
                message = t("books.deleteConfirmSingle", { title: titles });
            }

            openConfirmDialog({
                text: message,
                title: books.length > 1 ? t("books.deleteTitleMany") : t("books.deleteTitleSingle"),
                onOk: () => {
                    Promise.all(idsToDelete.filter((id): id is string => typeof id === "string" && id !== undefined).map(id => deleteBook(id)))
                        .then((results) => {
                            const successCount = results.filter(r => r.status === 200).length;
                            if (successCount === 0) throw new Error("Error! Books not deleted");
                            toast.success(
                                successCount > 1
                                    ? t("books.deleteSuccessMany", { count: successCount })
                                    : t("books.deleteSuccessSingle", { title: books[0].title })
                                , { autoClose: 3000 });
                            fetchBooks();
                        })
                        .catch((err) => {
                            toast.error(err.response?.data?.error);
                            console.trace(err);
                        });
                },
                onCancel: () => { }
            });
        };

        if (booksToDelete.length === idsToDelete.length) {
            proceedDelete(booksToDelete);
        } else {
            // Some books not in local state, fetch them
            Promise.all(idsToDelete.filter(id => typeof id === "string").map(id => {
                const localBook = clonedBooks.find((book: IBook) => book._id === id);
                return localBook
                    ? Promise.resolve(localBook)
                    : id ? getBook(id).then(({ data }) => data.book) : Promise.resolve(undefined);
            }))
                .then((books) => proceedDelete(books.filter(Boolean)))
                .catch((err) => {
                    toast.error(err.response?.data?.error);
                    console.trace(err);
                });
        }
    }

    const handlePageSizeChange = (newPageSize: number) => {
        const newPage = Math.floor(((pagination.page - 1) * pagination.pageSize) / newPageSize) + 1;
        setPagination(prevState => ({ ...prevState, page: newPage, pageSize: newPageSize }));
    };

    const handlePageChange = async (page: number) => {
        setPagination(prevState => ({ ...prevState, page: page }));
    };

    // Handle the add book button click
    const handleAddBook = () => {
        openBookModal([], handleSaveBook, saveBookSuccess);
    };

    return (
        <>
            <div ref={popRef} className={`showHideColumns ${showColumn.control ? "shown" : "hidden"}`}>
                <ShowHideColumns
                    columns={getBookTableColumns(t)}
                    shown={showColumn}
                    setShown={setShowColumn}
                    dimensionsLabel={t("table.books.dimensions")}
                    publishedLabel={t("table.books.published")}
                />
            </div>
            <ServerPaginationTable
                title={t("books.pageTitle", { count: countAll })}
                data={clonedBooks}
                columns={getBookTableColumns(t)}
                pageChange={handlePageChange}
                pageSizeChange={handlePageSizeChange}
                sortingChange={(sorting) => {
                    if (sorting.length === 0) sorting = DEFAULT_PAGINATION.sorting;
                    setPagination(prevState => ({ ...prevState, sorting: sorting }))
                }}
                filteringChange={(filters) => {
                    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
                    filterTimeoutRef.current = setTimeout(() => {
                        setPagination(prevState => ({ ...prevState, page: DEFAULT_PAGINATION.page, filters: filters }));
                    }, 1000);
                }}
                totalCount={countAll}
                loading={loading}
                pagination={pagination}
                hiddenCols={showColumn}
                actions={
                    <div key="actions" className="tableActionsRight">
                        <div className="searchTableWrapper">
                            <InputField
                                placeholder={t("books.searchPlaceholder")}
                                className="searchInput"
                                innerClass="searchInputInner"
                                value={pagination.search}
                                onChange={(e) =>
                                    setPagination((prevState) => ({
                                        ...prevState,
                                        page: DEFAULT_PAGINATION.page,
                                        search: e.target.value,
                                    }))
                                }
                            />
                            <div className="searchBtns">
                                <BarcodeScannerButton
                                    onBarcodeDetected={(code) =>
                                        setPagination((prevState) => ({
                                            ...prevState,
                                            page: DEFAULT_PAGINATION.page,
                                            search: code,
                                        }))
                                    }
                                    onError={(error) => console.error(error)}
                                />
                                <button
                                    key="clear-search"
                                    onClick={() =>
                                        setPagination((prevState) => ({
                                            ...prevState,
                                            page: DEFAULT_PAGINATION.page,
                                            search: "",
                                        }))
                                    }
                                >
                                    ✖
                                </button>
                            </div>
                        </div>
                        {/* Add book button for authenticated users */}
                        {isLoggedIn && !isGuest && isOnline && (
                            <button
                                type="button"
                                className="addBtnTable"
                                data-tooltip-id="global-tooltip"
                                data-tooltip-content={t("books.addNew")}
                                onClick={handleAddBook}
                            />
                        )}
                        <i
                            ref={exceptRef}
                            className="fas fa-bars bookTableAction ml-4"
                            data-tooltip-id="global-tooltip"
                            data-tooltip-content={t("books.showHideColumns")}
                            onClick={() => setShowColumn({ ...showColumn, control: !showColumn.control })}
                        />
                    </div>
                }
                rowActions={(_id, expandRow, isExpanded) => (
                    <div key={_id} className="actionsRow">
                        {isLoggedIn && !isGuest && isOnline && (
                            <>
                                <button
                                    key={`delete-${_id}`}
                                    data-tooltip-id="global-tooltip"
                                    data-tooltip-content={t("common.delete")}
                                    onClick={() => handleDeleteBook(_id)}
                                    className="fa fa-trash"
                                />
                                <button
                                    key={`edit-${_id}`}
                                    data-tooltip-id="global-tooltip"
                                    data-tooltip-content={t("common.edit")}
                                    className="fa fa-pencil-alt"
                                    onClick={() => handleUpdateBook(_id)}
                                />
                            </>
                        )}
                        <button
                            key={`detail-${_id}`}
                            data-tooltip-id="global-tooltip"
                            data-tooltip-content={t("common.details")}
                            className={`fa ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`}
                            onClick={() => expandRow()}
                        />
                    </div>
                )}
                expandedElement={(data) => <BookDetail data={data} />}
                selectedChanged={(ids) => setSelectedBooks(ids)}
                showSelection={!isGuest && isOnline}
            />
        </>
    );
}