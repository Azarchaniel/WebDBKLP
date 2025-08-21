import { IBook, IBookColumnVisibility } from "../../type";
import { useEffect, useRef, useState } from "react";
import { addBook, checkBooksUpdated, deleteBook, getBook, getBooks } from "../../API";
import { toast } from "react-toastify";
import AddBook from "./AddBook";
import {
    DEFAULT_PAGINATION,
    stringifyAutors,
    stringifyUsers,
    getBookTableColumns,
    ShowHideColumns,
    getCachedTimestamp,
    loadFirstPageFromCache,
    saveFirstPageToCache,
    isMobile,
    shortenStringKeepWord
} from "@utils";
import { openConfirmDialog } from "@components/ConfirmDialog";
import ServerPaginationTable from "@components/table/TableSP";
import BookDetail from "./BookDetail";
import "@styles/BookPage.scss";
import BarcodeScannerButton from "@components/BarcodeScanner";
import { useClickOutside } from "@hooks";
import { useAuth } from "@utils/context";
import { InputField } from "@components/inputs";

export default function BookPage() {
    const { currentUser, isLoading: isAuthLoading, isLoggedIn } = useAuth();
    const [clonedBooks, setClonedBooks] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        page: DEFAULT_PAGINATION.page,
        pageSize: DEFAULT_PAGINATION.pageSize,
        search: DEFAULT_PAGINATION.search,
        sorting: [...DEFAULT_PAGINATION.sorting],
        filters: DEFAULT_PAGINATION.filters
    });
    const [countAll, setCountAll] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [updateBooks, setUpdateBooks] = useState<IBook[] | undefined>();
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
        depth: false,
        weight: false,
        edition: false,
        serie: false,
        published: !isMobile(),
        exLibris: !isMobile(),
        readBy: !isMobile(),
        note: !isMobile(),
        location: !isMobile(),
        createdAt: false,
        updatedAt: !isMobile(),
        ownersFull: !isMobile()
    });
    const [saveBookSuccess, setSaveBookSuccess] = useState<boolean | undefined>(undefined);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [filterTimeoutId, setFilterTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [controller, setController] = useState<AbortController | null>(null);
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
            setLoading(true);

            // Abort previous request
            if (controller) {
                controller.abort();
            }
            // Create new AbortController
            const newController = new AbortController();
            setController(newController);

            // Check if data is up-to-date
            const { status } = await checkBooksUpdated(await getCachedTimestamp());

            // For first page only with default pagination and no new books, try to load from cache first
            if (checkIfFirstPage() && status === 204) {
                const cachedData = await loadFirstPageFromCache();

                if (cachedData) {
                    // Successfully loaded from cache
                    setCountAll(cachedData.count);
                    setClonedBooks(cachedData.books.sort((a, b) => a.title.localeCompare(b.title)));
                    setLoading(false);

                    return;
                }
            }

            getBooks({ ...pagination })
                .then(({ data: { books, count } }: IBook[] | any) => {
                    setCountAll(count);
                    const processedBooks = stringifyAutors(books);
                    processedBooks.map((book: any) => book["ownersFull"] = stringifyUsers(book.owner, false));
                    setClonedBooks(processedBooks);

                    // If this is first page without search, update the cache
                    if (checkIfFirstPage()) {
                        saveFirstPageToCache(books, count, pagination);
                    }
                })
                .catch(() => {
                    throw Error()
                })
                .finally(() => setLoading(false));
        } catch (err: any) {
            toast.error(err.response?.data?.error);
            console.error('Error fetching books:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        // Clear any existing timeout when pagination changes
        if (timeoutId) clearTimeout(timeoutId);

        // If search is empty, fetch immediately
        if (pagination.search === "") {
            fetchBooks();
            return;
        }

        // Set a new timeout for debounced fetching
        const newTimeoutId = setTimeout(() => {
            fetchBooks();
        }, 1000); // Wait 1s before making the request

        setTimeoutId(newTimeoutId);

        // Cleanup function to clear timeout if component unmounts or pagination changes again
        return () => {
            if (newTimeoutId) clearTimeout(newTimeoutId);
        };
    }, [pagination, currentUser, isAuthLoading]);

    const handleSaveBook = (formData: IBook | object | IBook[]): void => {
        setSaveBookSuccess(undefined);

        addBook(formData)
            .then((res) => {
                if (Array.isArray(formData) && formData.length > 1) {
                    let message = "";
                    if (res.length < 5) {
                        message = `${res.length} knihy boli úspešne upravené.`;
                    } else {
                        message = `${res.length} kníh bolo úspešne upravených.`;
                    }

                    toast.success(message);
                } else {
                    toast.success(
                        `Kniha ${Array.isArray(res) ?
                            res[0].data.book?.title :
                            res.data.book?.title
                        } bola úspešne ${(formData as IBook)._id ? "uložená" : "pridaná"}.`);
                }
                setSaveBookSuccess(true);
                fetchBooks()
            })
            .catch((err) => {
                toast.error(err.response?.data?.error || "Chyba! Kniha nebola uložená!");
                console.trace("Error saving books", err)
                setSaveBookSuccess(false);
            })
    }

    const handleUpdateBook = (_id?: string): void => {
        setSaveBookSuccess(undefined);

        if (_id) {
            const bookToUpdate = clonedBooks.find((book: IBook) => book._id === _id);

            if (bookToUpdate) {
                setUpdateBooks([bookToUpdate]);
            } else {
                getBook(_id)
                    .then(({ data }) => {
                        if (data.book) setUpdateBooks([data.book]);
                    })
                    .catch((err) => {
                        toast.error(err.response.data.error || "Chyba! Kniha nebola nájdená!");
                        console.trace(err);
                    })
            }
        }
        if (selectedBooks.length > 0) {
            const selectedBooksData = clonedBooks.filter((book: IBook) => selectedBooks.includes(book._id));

            setUpdateBooks(selectedBooksData);

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
            toast.error("Vyber aspoň jednu knihu na vymazanie!");
            return;
        }

        // Get book objects for confirmation dialog
        const booksToDelete = clonedBooks.filter((book: IBook) => idsToDelete.includes(book._id));

        const proceedDelete = (books: IBook[]) => {
            const titles = shortenStringKeepWord(books.map(b => b.title).join("\n "), 150);

            let message = "";
            if (books.length > 1 && books.length < 5) {
                message = `Naozaj chceš vymazať ${books.length} knihy?\n\n ${titles}`;
            } else if (books.length >= 5) {
                message = `Naozaj chceš vymazať ${books.length} kníh?\n\n ${titles}`;
            } else {
                message = `Naozaj chceš vymazať knihu ${titles}?`;
            }

            openConfirmDialog({
                text: message,
                title: books.length > 1 ? "Vymazať knihy?" : "Vymazať knihu?",
                onOk: () => {
                    Promise.all(idsToDelete.filter((id): id is string => typeof id === "string" && id !== undefined).map(id => deleteBook(id)))
                        .then((results) => {
                            const successCount = results.filter(r => r.status === 200).length;
                            if (successCount === 0) throw new Error("Error! Books not deleted");
                            toast.success(
                                successCount > 1
                                    ? `${successCount} kníh bolo úspešne vymazaných.`
                                    : `Kniha ${books[0].title} bola úspešne vymazaná.`
                            );
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

    return (
        <>
            {isLoggedIn && <AddBook
                saveBook={handleSaveBook}
                onClose={() => setUpdateBooks(undefined)}
                saveResultSuccess={saveBookSuccess}
            />}
            <div ref={popRef} className={`showHideColumns ${showColumn.control ? "shown" : "hidden"}`}>
                <ShowHideColumns columns={getBookTableColumns()} shown={showColumn} setShown={setShowColumn} />
            </div>
            <ServerPaginationTable
                title={`Knihy (${countAll})`}
                data={clonedBooks}
                columns={getBookTableColumns()}
                pageChange={handlePageChange}
                pageSizeChange={handlePageSizeChange}
                sortingChange={(sorting) => {
                    if (sorting.length === 0) sorting = DEFAULT_PAGINATION.sorting;
                    setPagination(prevState => ({ ...prevState, sorting: sorting }))
                }}
                filteringChange={(filters) => {
                    if (filterTimeoutId) clearTimeout(filterTimeoutId);

                    const newTimeoutId = setTimeout(() => {
                        setPagination(prevState => ({ ...prevState, page: DEFAULT_PAGINATION.page, filters: filters }));
                    }, 1000); // Wait 1s before applying the filters

                    setFilterTimeoutId(newTimeoutId);
                }}
                totalCount={countAll}
                loading={loading}
                pagination={pagination}
                hiddenCols={showColumn}
                actions={
                    <div key="actions" className="tableActionsRight">
                        <div className="searchTableWrapper">
                            <InputField
                                placeholder="Vyhľadaj knihu"
                                className="form-control searchBookInput"
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
                        <i
                            ref={exceptRef}
                            className="fas fa-bars bookTableAction ml-4"
                            title="Zobraz/skry stĺpce"
                            onClick={() => setShowColumn({ ...showColumn, control: !showColumn.control })}
                        />
                    </div>
                }
                rowActions={(_id, expandRow) => (
                    isLoggedIn ? <div key={_id} className="actionsRow" style={{ pointerEvents: "auto" }}>
                        <button
                            key={`delete-${_id}`}
                            title="¨Vymazať"
                            onClick={() => handleDeleteBook(_id)}
                            className="fa fa-trash"
                        />
                        <button
                            key={`edit-${_id}`}
                            title="Upraviť"
                            className="fa fa-pencil-alt"
                            onClick={() => handleUpdateBook(_id)}
                        />
                        <button
                            key={`detail-${_id}`}
                            title="Detaily"
                            className="fa fa-chevron-down"
                            onClick={() => expandRow()}
                        />
                    </div> : <></>
                )}
                expandedElement={(data) => <BookDetail data={data} />}
                selectedChanged={(ids) => setSelectedBooks(ids)}
            />
            {Boolean(updateBooks) &&
                <AddBook
                    saveBook={handleSaveBook}
                    books={updateBooks}
                    onClose={() => setUpdateBooks(undefined)}
                    saveResultSuccess={saveBookSuccess}
                />}
        </>
    );
}