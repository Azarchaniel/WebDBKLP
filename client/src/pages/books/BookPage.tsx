import {IBook, IBookHidden} from "../../type";
import React, {useEffect, useRef, useState} from "react";
import {addBook, deleteBook, getBook, getBooks} from "../../API";
import {toast} from "react-toastify";
import AddBook from "./AddBook";
import Sidebar from "../../components/Sidebar";
import Toast from "../../components/Toast";
import {stringifyAutors, stringifyUsers} from "../../utils/utils";
import Header from "../../components/AppHeader";
import {useReadLocalStorage} from "usehooks-ts";
import {ShowHideRow} from "../../components/books/ShowHideRow";
import {DEFAULT_PAGINATION} from "../../utils/constants";
import {openConfirmDialog} from "../../components/ConfirmDialog";
import ServerPaginationTable from "../../components/table/TableSP";
import {isUserLoggedIn} from "../../utils/user";
import {ColumnDef} from "@tanstack/react-table";
import {getBookTableColumns} from "../../utils/tableColumns";
import BookDetail from "./BookDetail";

export default function BookPage() {
    const [clonedBooks, setClonedBooks] = useState<any[]>([]);
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
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
    const popRef = useRef(null);
    const activeUsers = useReadLocalStorage("activeUsers");

    const [requestId, setRequestId] = useState(0);
    const latestRequestIdRef = useRef(0);

    //fetch books on page init
    useEffect(() => {
        fetchBooks();
    }, [])

    //fetch books when changed user
    useEffect(() => {
        fetchBooks();
    }, [activeUsers]);

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
    const fetchBooks = (): void => {
        try {
            setLoading(true);

            // Increment and capture the current request ID
            const currentRequestId = requestId + 1;
            setRequestId(currentRequestId);
            latestRequestIdRef.current = currentRequestId;

            getBooks({...pagination, activeUsers})
                .then(({data: {books, count}}: IBook[] | any) => {
                    // Only update state if this is still the latest request
                    if (currentRequestId === latestRequestIdRef.current) {
                        setCountAll(count);
                        books.map((book: any) => book["ownersFull"] = stringifyUsers(book.owner, false))
                        setClonedBooks(stringifyAutors(books));
                    }
                })
                .catch((err: Error) => console.trace(err))
                .finally(() => {
                    // Only update loading state if this is still the latest request
                    if (currentRequestId === latestRequestIdRef.current) {
                        setLoading(false);
                    }
                })
        } catch (err) {
            console.error('Error fetching books:', err);
        }
    }
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
        getBook(_id)
            .then(({data}) => {
                setUpdateBook(data.book);
            })
            .catch((err) => console.trace(err))
    }

    const handleDeleteBook = (_id: string): void => {
        getBook(_id)
            .then(({status, data}) => {
                if (status !== 200) {
                    throw new Error("Error! Book not found")
                }

                openConfirmDialog({
                    text: `Naozaj chceš vymazať knihu ${data.book?.title}?`,
                    title: "Vymazať knihu?",
                    onOk: () => {
                        deleteBook(_id)
                            .then(({status, data}) => {
                                if (status !== 200) {
                                    throw new Error("Error! Book not deleted")
                                }
                                toast.success(`Kniha ${data.book?.title} bola úspešne vymazaná.`);
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
            })
            .catch((err) => console.trace(err))
    }

    const handlePageSizeChange = (newPageSize: number) => {
        const newPage = Math.floor(((pagination.page - 1) * pagination.pageSize) / newPageSize) + 1;
        setPagination(prevState => ({...prevState, page: newPage, pageSize: newPageSize}));
    };

    const getColumnsForHidden = () => {
        const columnsForHidden = getBookTableColumns().filter((column: ColumnDef<IBook, any>) =>
            column["accessorKey" as keyof typeof column] !== "title" /* TEMPORARY ->  */ || column["accessorKey" as keyof typeof column] !== "wasChecked");

        return columnsForHidden.map((column: any) => {
            const {header, accessorKey}: { header: string, accessorKey: keyof typeof column } = column;

            if (column.id === "dimensions") {
                return <ShowHideRow
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
                label={header}
                init={hidden[accessorKey as string]}
                onChange={() => setHidden({...hidden, [accessorKey]: !hidden[accessorKey as string]})}
            />
        })
    }

    return (
        <main className='App'>
            {/* TODO: remove Header and Sidebar from here */}
            <Header/>
            <Sidebar/>
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
                pageChange={(page) => setPagination(prevState => ({...prevState, page: page}))}
                pageSizeChange={handlePageSizeChange}
                sortingChange={(sorting) => setPagination(prevState => ({...prevState, sorting: sorting}))}
                totalCount={countAll}
                loading={loading}
                pagination={pagination}
                hiddenCols={hidden}
                actions={
                    <div className="row justify-center mb-4 mr-2">
                        <div className="searchTableWrapper">
                            {/* reset pagination on search*/}
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
                            <button onClick={() => setPagination(prevState => ({
                                ...prevState,
                                page: DEFAULT_PAGINATION.page,
                                search: ""
                            }))}>✖
                            </button>
                        </div>
                        <i
                            className="fas fa-bars bookTableAction ml-4"
                            title="Zobraz/skry stĺpce"
                            onClick={() => setHidden({...hidden, control: !hidden.control})}
                        />
                    </div>
                }
                rowActions={(_id, expandRow) => (
                    isUserLoggedIn() ? <div className="actionsRow" style={{pointerEvents: "auto"}}>
                        {/* TEMPORARY input*/}
                        <input
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
                            title="¨Vymazať"
                            onClick={() => handleDeleteBook(_id)}
                            className="fa fa-trash"
                        />
                        <button
                            title="Upraviť"
                            className="fa fa-pencil-alt"
                            onClick={() => handleUpdateBook(_id)}
                        />
                        <button
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
            <Toast/>
        </main>
    );
}