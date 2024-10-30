import {IBook, IUser} from "../../type";
import React, {useEffect, useRef, useState} from "react";
import {addBook, deleteBook, getBook, getBooks} from "../../API";
import {toast} from "react-toastify";
import {confirmAlert} from "react-confirm-alert";
import AddBook from "./AddBook";
import Sidebar from "../../components/Sidebar";
import Toast from "../../components/Toast";
import MaterialTableCustom from "../../components/MaterialTableCustom";
import {stringifyAutors, stringifyUsers} from "../../utils/utils";
import Header from "../../components/AppHeader";
import { tableHeaderColor } from "../../utils/constants";
import { useReadLocalStorage } from "usehooks-ts";
import BookDetail from "./BookDetail";
import { ShowHideRow } from "../../components/ShowHideRow";

interface IBookHidden {
    control: boolean,
    editor: boolean,
    ilustrator: boolean,
    translator: boolean,
    subtitle: boolean,
    content: boolean,
    dimensions: boolean,
    createdAt: boolean,
    location: boolean,
    owner: boolean
}

export default function BookPage() {
    const [clonedBooks, setClonedBooks] = useState<any[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
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
        createdAt: true,
        location: true,
        owner: true
    });
    const popRef = useRef(null);
    const activeUser = useReadLocalStorage("activeUsers");

    //fetch books on page init
    useEffect(() => {
        fetchBooks();
    }, [])

    //fetch books when changed user
    useEffect(() => {
        fetchBooks();
    }, [activeUser]);

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
            .then(({data: {books, count}}: IBook[] | any) => {
                //TODO: CLEAN
                if ((activeUser as string[])?.length) {
                    const booksArr: IBook[] = [];
                    books.forEach((book: IBook) => {
                        //TODO: this filtering should be on BE
                        book.owner?.forEach((owner: IUser) => {
                            if ((activeUser as string[]).includes(owner._id) || book.owner === undefined) {
                                booksArr.push(book);
                            }
                        })
                    })
                    books = booksArr;
                }
                
                setCountAll(count);
                
                books.map((book: any) => book['ownersFull'] = stringifyUsers(book.owner, false))

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
            {/* TODO: remove Header and Sidebar from here */}
            <Header/>
            <Sidebar/>
            <AddBook saveBook={handleSaveBook} open={openModal}/>
            <div ref={popRef} className={`showHideColumns ${hidden.control ? 'hidden' : 'shown'}`}>
                <ShowHideRow label="Editor" init={hidden.editor} onChange={() => setHidden({...hidden, editor: !hidden.editor})} />
                <ShowHideRow label="Ilustrátor" init={hidden.ilustrator} onChange={() => setHidden({...hidden, ilustrator: !hidden.ilustrator})} />
                <ShowHideRow label="Prekladateľ" init={hidden.translator} onChange={() => setHidden({...hidden, translator: !hidden.translator})} />
                <ShowHideRow label="Podtitul" init={hidden.subtitle} onChange={() => setHidden({...hidden, subtitle: !hidden.subtitle})} />
                <ShowHideRow label="Obsah" init={hidden.content} onChange={() => setHidden({...hidden, content: !hidden.content})} />
                <ShowHideRow label="Rozmery" init={hidden.dimensions} onChange={() => setHidden({...hidden, dimensions: !hidden.dimensions})} />
                <ShowHideRow label="Dátum pridania" init={hidden.createdAt} onChange={() => setHidden({...hidden, createdAt: !hidden.createdAt})} />
                <ShowHideRow label="Umiestnenie" init={hidden.location} onChange={() => setHidden({...hidden, location: !hidden.location})} />
                <ShowHideRow label="Majiteľ" init={hidden.owner} onChange={() => setHidden({...hidden, owner: !hidden.owner})} />
            </div>
            <MaterialTableCustom
                loading={loading}
                title={`Knihy (${countAll})`}
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
                        title: 'Podtitul',
                        field: 'content',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        hidden: hidden.content
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
                        title: 'Rozmery',
                        field: 'dimensions',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        hidden: hidden.dimensions
                    },
                    {
                        title: 'Poznámka',
                        field: 'note',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                    },
                    {
                        title: 'Datum pridania',
                        field: 'createdAt',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        hidden: hidden.createdAt
                    },
                    {
                        title: 'umiestnenie',
                        field: 'location',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        hidden: hidden.location
                    },
                    {
                        title: 'Majiteľ',
                        field: 'ownersFull',
                        headerStyle: {
                            backgroundColor: tableHeaderColor
                        },
                        hidden: hidden.owner
                    },
                ]}
                data={clonedBooks}
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
                        icon: 'search',
                        tooltip: 'Detaily',
                        render: (rowData: any) => <BookDetail data={rowData}/>
                    }
                ]}
            />
            {Boolean(updateBookId) ? <AddBook saveBook={handleSaveBook} bookId={updateBookId} /> : <></>}
            <Toast/>
        </main>
    );
}