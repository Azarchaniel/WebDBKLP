import {IBook, IBookHidden, IUser} from "../../type";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {addBook, checkBooksUpdated, deleteBook, getBook, getBooks} from "../../API";
import {toast} from "react-toastify";
import AddBook from "./AddBook";
import {stringifyAutors, stringifyUsers} from "../../utils/utils";
import {useReadLocalStorage} from "usehooks-ts";
import {ShowHideRow} from "../../components/books/ShowHideRow";
import {DEFAULT_PAGINATION} from "../../utils/constants";
import {openConfirmDialog} from "../../components/ConfirmDialog";
import ServerPaginationTable from "../../components/table/TableSP";
import {isUserLoggedIn} from "../../utils/user";
import {ColumnDef} from "@tanstack/react-table";
import {getBookTableColumns} from "../../utils/tableColumns";
import BookDetail from "./BookDetail";
import {getCachedTimestamp, loadFirstPageFromCache, saveFirstPageToCache} from "../../utils/indexDb";
import {useClickOutside} from "../../utils/hooks";
import Layout from "../../Layout";

export default function BookPage() {
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
    const [hidden, setHidden] = useState<IBookHidden>({
        control: true,
        autorsFull: true,
        editorsFull: false,
        ilustratorsFull: false,
        translatorsFull: true,
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
        published: true,
        exLibris: true,
        readBy: true,
        note: true,
        createdAt: true,
        location: true,
        ownersFull: true
    });
    const [saveBookSuccess, setSaveBookSuccess] = useState<boolean | undefined>(undefined);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [controller, setController] = useState<AbortController | null>(null);
    const activeUsers: IUser[] | null = useReadLocalStorage("activeUsers");
    const memoizedActiveUsers = useMemo(() => activeUsers, [JSON.stringify(activeUsers)]);
    const popRef = useRef<HTMLDivElement>(null);
    const exceptRef = useRef<HTMLDivElement>(null);

    useClickOutside(popRef, () => {
        setHidden(prevState => ({
            ...prevState,
            control: true
        }));
    }, exceptRef);

    const checkIfFirstPage = () => {
        return JSON.stringify(pagination) === JSON.stringify(DEFAULT_PAGINATION);
    }

    //fetch books on page init
    useEffect(() => {
        fetchBooks();
    }, [])

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

    useEffect(() => {
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
            if (checkIfFirstPage() && activeUsers?.length === 0 && status === 204) {
                const cachedData = await loadFirstPageFromCache();

                if (cachedData) {
                    // Successfully loaded from cache
                    setCountAll(cachedData.count);
                    setClonedBooks(cachedData.books.sort((a, b) => a.title.localeCompare(b.title)));
                    setLoading(false);

                    return;
                }
            }

            // Always fetch fresh data from API
            getBooks({...pagination, activeUsers})
                .then(({data: {books, count}}: IBook[] | any) => {
                    setCountAll(count);
                    const processedBooks = stringifyAutors(books);
                    processedBooks.map((book: any) => book["ownersFull"] = stringifyUsers(book.owner, false));
                    setClonedBooks(processedBooks);

                    // If this is first page without search, update the cache
                    if (checkIfFirstPage() && activeUsers?.length === 0) {
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
    }, [pagination]);

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

    //TODO: move to utils - getBookTableColumns, IBook, setHidden
    const getColumnsForHidden = () => {
        const columnsForHidden = getBookTableColumns().filter((column: ColumnDef<IBook, any>) =>
            column["accessorKey" as keyof typeof column] !== "title" /* TEMPORARY ->  */ || column["accessorKey" as keyof typeof column] !== "wasChecked");

        return columnsForHidden.map((column: any) => {
            const {header, accessorKey}: { header: string, accessorKey: keyof typeof column } = column;

            if (column.id === "dimensions") {
                return <ShowHideRow
                    key="dimensions"
                    label="Rozmery"
                    init={hidden.dimensions}
                    onChange={() => setHidden({
                        ...hidden,
                        dimensions: !hidden.dimensions,
                        height: !hidden.dimensions,
                        width: !hidden.dimensions,
                        depth: !hidden.dimensions,
                        weight: !hidden.dimensions
                    })}/>
            }

            return <ShowHideRow
                key={accessorKey as string}
                label={header}
                init={hidden[accessorKey as string]}
                onChange={() => setHidden({...hidden, [accessorKey]: !hidden[accessorKey as string]})}
            />
        })
    }

    return (
        <Layout>
            {isUserLoggedIn() && <AddBook
                saveBook={handleSaveBook}
                onClose={() => setUpdateBook(undefined)}
                saveResultSuccess={saveBookSuccess}
            />}
            <div ref={popRef} className={`showHideColumns ${hidden.control ? "hidden" : "shown"}`}>
                {getColumnsForHidden()}
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
                hiddenCols={hidden}
                actions={
                    <div key="actions" className="row justify-center mb-4 mr-2">
                        <div className="searchTableWrapper">
                            <input
                                placeholder="Vyhľadaj knihu"
                                style={{paddingRight: "2rem"}}
                                className="form-control"
                                value={pagination.search}
                                onChange={(e) =>
                                    setPagination(prevState => ({
                                        ...prevState,
                                        page: DEFAULT_PAGINATION.page,
                                        search: e.target.value
                                    }))}
                            />
                            <button key="clear-search" onClick={() => setPagination(prevState => ({
                                ...prevState,
                                page: DEFAULT_PAGINATION.page,
                                search: ""
                            }))}>✖
                            </button>
                        </div>
                        <i
                            ref={exceptRef}
                            className="fas fa-bars bookTableAction ml-4"
                            title="Zobraz/skry stĺpce"
                            onClick={() => setHidden({...hidden, control: !hidden.control})}
                        />
                    </div>
                }
                rowActions={(_id, expandRow) => (
                    isUserLoggedIn() ? <div key={_id} className="actionsRow" style={{pointerEvents: "auto"}}>
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
        </Layout>
    );
}