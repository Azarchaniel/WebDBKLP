import {IBook, IUser} from "../../type";
import React, {useEffect, useRef, useState} from "react";
import {addBook, deleteBook, getBook, getBooks} from "../../API";
import {toast} from "react-toastify";
import {confirmAlert} from "react-confirm-alert";
import AddBook from "./AddBook";
import Sidebar from "../../components/Sidebar";
import Toast from "../../components/Toast";
import MaterialTableCustom from "../../components/MaterialTableCustom";
import {shortenStringKeepWord, stringifyAutors} from "../../utils/utils";
import BookDetail from "./BookDetail";
import Header from "../../components/Header";
import { tableHeaderColor } from "../../utils/constants";
import { TooltipedText } from "../../utils/elements";

interface IBookHidden {
    control: boolean,
    editor: boolean,
    ilustrator: boolean,
    translator: boolean,
    subtitle: boolean,
    content: boolean,
    dimensions: boolean,
    createdAt: boolean
}

export default function BookPage() {
    const [clonedBooks, setClonedBooks] = useState<any[]>();
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [updateBookId, setUpdateBookId] = useState<string>('');
    const [hidden, setHidden] = useState<IBookHidden>({
        control: true,
        editor: true,
        ilustrator: true,
        translator: false,
        subtitle: true,
        content: true,
        dimensions: true,
        createdAt: true
    });
    const popRef = useRef(null);

    useEffect(() => {
        fetchBooks();
    }, [])

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
        getBooks()
            .then(({data: {books}}: IBook[] | any) => {
                const userId = window.location.href.split('/')[4];

                if (userId) {
                    const booksArr: IBook[] = [];
                    books.forEach((book: IBook) => {
                        book.owner?.forEach((owner: IUser) => {
                            if (owner._id === userId) {
                                booksArr.push(book);
                                return;
                            }
                        })
                    })
                    books = booksArr;
                }
                books = books.filter((bk: IBook) => !bk.deletedAt);
                
                setClonedBooks(stringifyAutors(books));
            })
            .catch((err: Error) => console.trace(err))
            .finally(() => setLoading(false))
    }

    const handleSaveBook = (e: React.FormEvent, formData: IBook): void => {
        e.preventDefault()
        addBook(formData)
            .then(({status, data}) => {
                if (status !== 201) {
                    toast.error('Chyba! Kniha nebola pridaná!')
                    throw new Error('Chyba! Kniha nebola pridaná!');
                }
                toast.success(`Kniha ${data.book?.title} bola úspešne pridaná.`);
                //setBooks(data.books)
            })
            .catch((err) => console.trace(err))
    }

    /*const handleUpdateBook = (bookId: string): JSX.Element => {
        return (<AddBook saveBook={handleSaveBook} bookId={bookId} open={true}/>);
    }*/

    const handleDeleteBook = (_id: string): void => {
        getBook(_id)
            .then(({status, data}) => {
                if (status !== 200) {
                    throw new Error('Error! Book not deleted')
                }

                confirmAlert({
                    title: 'Vymazat knihu?',
                    message: `Naozaj chces vymazat knihu ${data.book?.title}?`,
                    buttons: [
                        {
                            label: 'Ano',
                            onClick: () => {
                                deleteBook(_id)
                                    .then(({status, data}) => {
                                        if (status !== 200) {
                                            throw new Error('Error! Book not deleted')
                                        }
                                        toast.success(`Kniha ${data.book?.title} bola uspesne vymazana.`);
                                        fetchBooks();
                                    })
                                    .catch((err) => {
                                        toast.error('Chyba! Knihu nemožno vymazať!');
                                        console.trace(err);
                                    })
                            }
                        },
                        {
                            label: 'Ne',
                            onClick: () => {
                            }
                        }
                    ]
                });
            })
            .catch((err) => console.trace(err))
    }

    return (
        <main className='App'>
            <Header/>
            <Sidebar/>
            <AddBook saveBook={handleSaveBook} open={openModal}/>
            <div ref={popRef} className={`showHideColumns ${hidden.control ? 'hidden' : 'shown'}`}>
                <p>
                    <label>
                        <input type='checkbox'
                               checked={hidden.editor}
                               onChange={() => setHidden({...hidden, editor: !hidden.editor})}
                        />
                        Editor
                    </label>
                </p>
                <p>
                    <label>
                        <input type='checkbox'
                               checked={hidden.ilustrator}
                               onChange={() => setHidden({...hidden, ilustrator: !hidden.ilustrator})}
                        />
                        Ilustrátor
                    </label>
                </p>
                <p>
                    <label>
                        <input type='checkbox'
                               checked={hidden.translator}
                               onChange={() => setHidden({...hidden, translator: !hidden.translator})}
                        />
                        Prekladateľ
                    </label>
                </p>
                <p>
                    <label>
                        <input type='checkbox'
                               checked={hidden.subtitle}
                               onChange={() => setHidden({...hidden, subtitle: !hidden.subtitle})}
                        />
                        Podtitul
                    </label>
                </p>
                <p>
                    <label>
                        <input type='checkbox'
                               checked={hidden.content}
                               onChange={() => setHidden({...hidden, content: !hidden.content})}
                        />
                        Obsah
                    </label>
                </p>
                <p>
                    <label>
                        <input type='checkbox'
                               checked={hidden.dimensions}
                               onChange={() => setHidden({...hidden, dimensions: !hidden.dimensions})}
                        />
                        Rozmery
                    </label>
                </p>
                <p>
                    <label>
                        <input type='checkbox'
                               checked={hidden.createdAt}
                               onChange={() => setHidden({...hidden, createdAt: !hidden.createdAt})}
                        />
                        Dátum pridania
                    </label>
                </p>
            </div>
            <MaterialTableCustom
                loading={loading}
                title='Knihy'
                data={clonedBooks ?? []}
                columns={[
                    {
                        title: 'Autor',
                        field: 'autorsFull',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                    },
                    {
                        title: 'Editor',
                        field: 'editorsFull',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        hidden: hidden.editor
                    },
                    {
                        title: 'Prekladateľ',
                        field: 'translatorsFull',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        hidden: hidden.translator
                    },
                    {
                        title: 'Ilustrátor',
                        field: 'ilustratorsFull',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        hidden: hidden.ilustrator
                    },
                    {
                        title: 'Názov',
                        field: 'title',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        cellStyle: {
                            fontWeight: "bold"
                        }
                    },
                    {
                        title: 'Podnázov',
                        field: 'subtitle',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        hidden: hidden.subtitle
                    },
                    {
                        title: 'ISBN',
                        field: 'ISBN',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        }
                    },
                    {
                        title: 'Jazyk',
                        field: 'language',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        }
                    },
                    {
                        title: 'Počet strán',
                        field: 'numberOfPages',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        }
                    },
                    {
                        title: 'Poznámka',
                        field: 'note',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        //detail doesnt work if render is in table
                        render: (rowData: IBook) => {
                            return rowData.note?.length > 30 ? TooltipedText(shortenStringKeepWord(rowData.note, 30), rowData.note) : rowData.note;
                        },
                    },
                ]}
                actions={[
                    {
                        icon: 'visibility',
                        tooltip: 'Zobraz/Skry stĺpce',
                        onClick: () => {
                            setHidden({...hidden, control: !hidden.control})
                        },
                        isFreeAction: true,
                    },
                    {
                        icon: 'create',
                        tooltip: 'Upraviť',
                        onClick: (_: any, rowData: IBook) => setUpdateBookId(rowData._id),
                    },
                    {
                        icon: 'delete',
                        tooltip: 'Vymazať',
                        onClick: (_: any, rowData: IBook) => handleDeleteBook(rowData._id),
                    }
                ]}
                detailPanel={[
                    {
                        tooltip: 'Detaily',
                        render: (rowData: any) => <BookDetail data={rowData}/>
                    },
                ]}
            />
            {Boolean(updateBookId) ? <AddBook saveBook={handleSaveBook} bookId={updateBookId} /> : <></>}
            <Toast/>
        </main>
    );
}