import { IBook, IBookColumnVisibility } from "../../type";
import React, { useEffect, useRef, useState } from "react";
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
    isMobile
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
            .then(({ status, data }) => {
                if (status !== 200) {
                    throw Error();
                }
                if (Array.isArray(formData) && formData.length > 1) {
                    toast.success(`${formData.length} kníh bolo úspešne upravených.`);
                } else {
                    toast.success(`Kniha ${data.book?.title} bola úspešne ${(formData as IBook)._id ? "uložená" : "pridaná"}.`);
                }
                setSaveBookSuccess(true);
                fetchBooks()
            })
            .catch((err) => {
                toast.error(err.response.data.error);
                console.trace("Error getting books", err)
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
                        toast.error(err.response.data.error);
                        console.trace(err);
                    })
            }
        }
        if (selectedBooks.length > 0) {
            const selectedBooksData = clonedBooks.filter((book: IBook) => selectedBooks.includes(book._id));

            setUpdateBooks(selectedBooksData);

        }
    }

    const handleDeleteBook = (_id: string): void => {
        let bookToDelete = clonedBooks.find((book: IBook) => book._id === _id);

        if (!bookToDelete) {
            getBook(_id)
                .then(({ data }) => {
                    bookToDelete = data.book;
                })
                .catch((err) => {
                    toast.error(err.response.data.error);
                    console.trace(err)
                })
        }

        openConfirmDialog({
            text: `Naozaj chceš vymazať knihu ${bookToDelete?.title}?`,
            title: "Vymazať knihu?",
            onOk: () => {
                deleteBook(_id)
                    .then(({ status }) => {
                        if (status !== 200) {
                            throw new Error("Error! Book not deleted")
                        }
                        toast.success(`Kniha ${bookToDelete.title} bola úspešne vymazaná.`);
                        fetchBooks();
                    })
                    .catch((err) => {
                        toast.error(err.response.data.error);
                        console.trace(err);
                    })
            },
            onCancel: () => {
            }
        });
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