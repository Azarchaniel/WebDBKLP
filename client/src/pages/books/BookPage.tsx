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
                
                for (let book of books) {
                    if (book.note) {
                        book.note = shortenStringKeepWord(book.note, 30)
                    }
                }
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
                    toast.error('Chyba! Kniha nebola pridan??!')
                    throw new Error('Chyba! Kniha nebola pridan??!');
                }
                toast.success(`Kniha ${data.book?.title} bola ??spe??ne pridan??.`);
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
                                        toast.error('Chyba! Knihu nemo??no vymaza??!');
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
                        Ilustr??tor
                    </label>
                </p>
                <p>
                    <label>
                        <input type='checkbox'
                               checked={hidden.translator}
                               onChange={() => setHidden({...hidden, translator: !hidden.translator})}
                        />
                        Prekladate??
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
                        D??tum pridania
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
                            backgroundColor: '#bea24b'
                        },
                    },
                    {
                        title: 'Editor',
                        field: 'editorsFull',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        },
                        hidden: hidden.editor
                    },
                    {
                        title: 'Prekladate??',
                        field: 'translatorsFull',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        },
                        hidden: hidden.translator
                    },
                    {
                        title: 'Ilustr??tor',
                        field: 'ilustratorsFull',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        },
                        hidden: hidden.ilustrator
                    },
                    {
                        title: 'N??zov',
                        field: 'title',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        },
                        cellStyle: {
                            fontWeight: "bold"
                        }
                    },
                    {
                        title: 'Podn??zov',
                        field: 'subtitle',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        },
                        hidden: hidden.subtitle
                    },
                    {
                        title: 'ISBN',
                        field: 'ISBN',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        }
                    },
                    {
                        title: 'Jazyk',
                        field: 'language',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        }
                    },
                    {
                        title: 'Po??et str??n',
                        field: 'numberOfPages',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        }
                    },
                    {
                        title: 'Pozn??mka',
                        field: 'note',
                        headerStyle: {
                            backgroundColor: '#bea24b'
                        },
                    },

                ]}
                actions={[
                    {
                        icon: 'visibility',
                        tooltip: 'Zobraz/Skry st??pce',
                        onClick: () => {
                            setHidden({...hidden, control: !hidden.control})
                        },
                        isFreeAction: true,
                    },
                    {
                        icon: 'create',
                        tooltip: 'Upravi??',
                        onClick: (_: any, rowData: IBook) => /*handleUpdateBook(rowData._id)*/console.log(rowData),
                    },
                    {
                        icon: 'delete',
                        tooltip: 'Vymaza??',
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
            <Toast/>
        </main>
    );
}