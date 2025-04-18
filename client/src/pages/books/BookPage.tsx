import {IBook, IBookColumnVisibility, IUser} from "../../type";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {addBook, checkBooksUpdated, deleteBook, getBook, getBooks} from "../../API";
import {toast} from "react-toastify";
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
import {useReadLocalStorage} from "usehooks-ts";
import {openConfirmDialog} from "@components/ConfirmDialog";
import ServerPaginationTable from "@components/table/TableSP";
import BookDetail from "./BookDetail";
import "@styles/BookPage.scss";
import BarcodeScannerButton from "@components/BarcodeScanner";
import {useClickOutside} from "@hooks";
import {useAuth} from "@utils/context";

export default function BookPage() {
    const {currentUser, isLoading: isAuthLoading, isLoggedIn} = useAuth();
    const [clonedBooks, setClonedBooks] = useState<any[]>([]);
    const [pagination, setPagination] = useState({
        page: DEFAULT_PAGINATION.page,
        pageSize: DEFAULT_PAGINATION.pageSize,
        search: DEFAULT_PAGINATION.search,
        sorting: [...DEFAULT_PAGINATION.sorting]
    });
    const [countAll, setCountAll] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [updateBook, setUpdateBook] = useState<IBook>();
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
        createdAt: false,
        updatedAt: !isMobile(),
        location: !isMobile(),
        ownersFull: !isMobile()
    });
    const [saveBookSuccess, setSaveBookSuccess] = useState<boolean | undefined>(undefined);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [controller, setController] = useState<AbortController | null>(null);
    const activeUsers: IUser[] | null = useReadLocalStorage("activeUsers");
    const memoizedActiveUsers = useMemo(() => activeUsers, [JSON.stringify(activeUsers)]);
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

    //fetch books when changed user
    useEffect(() => {
        // Clear any existing timeout when pagination changes
        if (timeoutId) clearTimeout(timeoutId);

        // Set a new timeout for debounced fetching
        const newTimeoutId = setTimeout(() => {
            fetchBooks();
        }, 1000); // Wait 1s before making the request

        setTimeoutId(newTimeoutId);

        // Cleanup function to clear timeout if component unmounts or pagination changes again
        return () => {
            if (newTimeoutId) clearTimeout(newTimeoutId);
        };
    }, [memoizedActiveUsers]);

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
            const {status} = await checkBooksUpdated(await getCachedTimestamp());

            // For first page only with default pagination and no new books, try to load from cache first
            if (checkIfFirstPage() && (activeUsers?.length === 0 || !activeUsers) && status === 204) {
                const cachedData = await loadFirstPageFromCache();

                if (cachedData) {
                    // Successfully loaded from cache
                    setCountAll(cachedData.count);
                    setClonedBooks(cachedData.books.sort((a, b) => a.title.localeCompare(b.title)));
                    setLoading(false);

                    return;
                }
            }

            getBooks({...pagination, activeUsers})
                .then(({data: {books, count}}: IBook[] | any) => {
                    setCountAll(count);
                    const processedBooks = stringifyAutors(books);
                    processedBooks.map((book: any) => book["ownersFull"] = stringifyUsers(book.owner, false));
                    setClonedBooks(processedBooks);

                    // If this is first page without search, update the cache
                    if (checkIfFirstPage() && (activeUsers?.length === 0 || !activeUsers)) {
                        saveFirstPageToCache(books, count, pagination);
                    }
                })
                .catch((err: Error) => console.trace(err))
                .finally(() => setLoading(false));
        } catch (err) {
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

    const [wasCheckedLoading, setWasCheckedLoading] = useState<boolean>(false); //TEMP
    const handleSaveBook = (formData: IBook, wasCheckedBox?: boolean): void => {
        if (wasCheckedBox) setWasCheckedLoading(true); //TEMP

        addBook(formData)
            .then(({status, data}) => {
                if (status !== 200) {
                    toast.error(`Chyba! Kniha ${data.book?.title} nebola ${formData._id ? "uložená" : "pridaná"}.`)
                    throw new Error("Chyba! Kniha nebola pridaná!");
                }
                toast.success(`Kniha ${data.book?.title} bola úspešne ${formData._id ? "uložená" : "pridaná"}.`);
                setSaveBookSuccess(true);
                fetchBooks()
            })
            .catch((err) => {
                console.trace(err)
                setSaveBookSuccess(false);
            })
            .finally(() => setWasCheckedLoading(false)) //TEMP
    }

    const handleUpdateBook = (_id: string): void => {
        setSaveBookSuccess(undefined);

        const bookToUpdate = clonedBooks.find((book: IBook) => book._id === _id);

        if (bookToUpdate) {
            setUpdateBook(bookToUpdate);
        } else {
            getBook(_id)
                .then(({data}) => {
                    setUpdateBook(data.book);
                })
                .catch((err) => console.trace(err))
        }
    }

    const handleDeleteBook = (_id: string): void => {
        let bookToDelete = clonedBooks.find((book: IBook) => book._id === _id);

        if (!bookToDelete) {
            getBook(_id)
                .then(({data}) => {
                    bookToDelete = data.book;
                })
                .catch((err) => console.trace(err))
        }

        openConfirmDialog({
            text: `Naozaj chceš vymazať knihu ${bookToDelete?.title}?`,
            title: "Vymazať knihu?",
            onOk: () => {
                deleteBook(_id)
                    .then(({status}) => {
                        if (status !== 200) {
                            throw new Error("Error! Book not deleted")
                        }
                        toast.success(`Kniha ${bookToDelete.title} bola úspešne vymazaná.`);
                        fetchBooks();
                    })
                    .catch((err) => {
                        toast.error("Chyba! Knihu nemožno vymazať!");
                        console.trace(err);
                    })
            },
            onCancel: () => {
            }
        });
    }

    const handlePageSizeChange = (newPageSize: number) => {
        const newPage = Math.floor(((pagination.page - 1) * pagination.pageSize) / newPageSize) + 1;
        setPagination(prevState => ({...prevState, page: newPage, pageSize: newPageSize}));
    };

    const handlePageChange = async (page: number) => {
        setPagination(prevState => ({...prevState, page: page}));
    };

    return (
        <>
            {isLoggedIn && <AddBook
                saveBook={handleSaveBook}
                onClose={() => setUpdateBook(undefined)}
                saveResultSuccess={saveBookSuccess}
            />}
            <div ref={popRef} className={`showHideColumns ${showColumn.control ? "shown" : "hidden"}`}>
                <ShowHideColumns columns={getBookTableColumns()} shown={showColumn} setShown={setShowColumn}/>
            </div>
            <ServerPaginationTable
                title={`Knihy (${countAll})`}
                data={clonedBooks}
                columns={getBookTableColumns()}
                pageChange={handlePageChange}
                pageSizeChange={handlePageSizeChange}
                sortingChange={(sorting) => {
                    if (sorting.length === 0) sorting = DEFAULT_PAGINATION.sorting;
                    setPagination(prevState => ({...prevState, sorting: sorting}))
                }}
                totalCount={countAll}
                loading={loading}
                pagination={pagination}
                hiddenCols={showColumn}
                actions={
                    <div key="actions" className="tableActionsRight">
                        <div className="searchTableWrapper">
                            <input
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
                            onClick={() => setShowColumn({...showColumn, control: !showColumn.control})}
                        />
                    </div>
                }
                rowActions={(_id, expandRow) => (
                    isLoggedIn ? <div key={_id} className="actionsRow" style={{pointerEvents: "auto"}}>
                        {/* TEMPORARY input*/}
                        <input
                            key={`checkbox-${_id}`}
                            type="checkbox"
                            title="Zaškrtni, ak sme túto knihu skontrolovali"
                            checked={clonedBooks.find((book: IBook) => book._id === _id)?.wasChecked}
                            onChange={() => handleSaveBook({
                                ...clonedBooks.find((book: IBook) => book._id === _id),
                                wasChecked: !(clonedBooks.find((book: IBook) => book._id === _id).wasChecked)
                            }, true)}
                            disabled={wasCheckedLoading}
                        />
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
                expandedElement={(data) => <BookDetail data={data}/>}
            />
            {Boolean(updateBook) &&
                <AddBook
                    saveBook={handleSaveBook}
                    book={updateBook}
                    onClose={() => setUpdateBook(undefined)}
                    saveResultSuccess={saveBookSuccess}
                />}
        </>
    );
}