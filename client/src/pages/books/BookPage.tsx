import {IBook, IBookHidden, IUser} from "../../type";
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
import { useReadLocalStorage } from "usehooks-ts";
import BookDetail from "./BookDetail";
import { ShowHideRow } from "../../components/books/ShowHideRow";
import {BookTableColumns} from "../../utils/constants";

export default function BookPage() {
    const [clonedBooks, setClonedBooks] = useState<any[]>([]);
    const [countAll, setCountAll] = useState<number>(0);
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

    const handleSaveBook = (formData: IBook): void => {
        addBook(formData)
            .then(({status, data}) => {
                if (status !== 201) {
                    toast.error('Chyba! Kniha nebola pridaná!')
                    throw new Error('Chyba! Kniha nebola pridaná!');
                }
                toast.success(`Kniha ${data.book?.title} bola úspešne pridaná.`);
                fetchBooks()
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
            <AddBook saveBook={handleSaveBook}/>
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
                columns={BookTableColumns(hidden)}
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
            {Boolean(updateBookId) && <AddBook saveBook={handleSaveBook} />}
            <Toast/>
        </main>
    );
}