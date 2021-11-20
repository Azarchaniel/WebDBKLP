import {IBook, IUser} from "../../type";
import BookItem from "./BookItem";
import React, {useEffect, useState} from "react";
import {addBook, deleteBook, getBook, getBooks, updateBook} from "../../API";
import {toast} from "react-toastify";
import {confirmAlert} from "react-confirm-alert";
import AddBook from "./AddBook";
import Sidebar from "../../components/Sidebar";
import Toast from "../../components/Toast";
import {Link} from "react-router-dom";

//add prop for User
export default function BookPage() {
    const [books, setBooks] = useState<IBook[]>([]);

    useEffect(() => {
        console.log('#######');
        fetchBooks();
    }, [window.location.href])

    // ### BOOKS ###
    const fetchBooks = (): void => {
        getBooks()
            .then(({ data: { books } }: IBook[] | any) => {
                const userId = window.location.href.split('/')[4];

                if (userId) {
                    //todo: simplify
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

                setBooks(books);
            })
            .catch((err: Error) => console.trace(err))
    }

    const handleSaveBook = (e: React.FormEvent, formData: IBook): void => {
        e.preventDefault()
        console.trace('handle',formData);
        addBook(formData)
            .then(({ status, data }) => {
                if (status !== 201) {
                    toast.error('Chyba! Kniha nebola pridaná!')
                    throw new Error('Chyba! Kniha nebola pridaná!');
                }
                toast.success(`Kniha ${data.book?.title} bola úspešne pridaná.`);
                setBooks(data.books)
            })
            .catch((err) => console.trace(err))
    }

    const handleUpdateBook = (book: IBook): void => {
        updateBook(book)
            .then(({ status, data }) => {
                if (status !== 200) {
                    throw new Error('Error! Todo not updated')
                }
                setBooks(data.books)
            })
            .catch((err) => console.trace(err))
    }

    const handleDeleteBook = (_id: string): void => {
        getBook(_id)
            .then(({ status, data }) => {
                if (status !== 200) {
                    throw new Error('Error! Todo not deleted')
                }

                confirmAlert({
                    title: 'Vymazat knihu?',
                    message: `Naozaj chces vymazat knihu ${data.book?.title}?`,
                    buttons: [
                        {
                            label: 'Ano',
                            onClick: () => {
                                deleteBook(_id)
                                    .then(({ status, data }) => {
                                        if (status !== 200) {
                                            throw new Error('Error! Book not deleted')
                                        }
                                        toast.success(`Kniha ${data.book?.title} bola uspesne vymazana.`);
                                        setBooks(data.books)
                                    })
                                    .catch((err) => {
                                        toast.error('Chyba! Knihu nemožno vymazať!');
                                        console.trace(err);
                                    })
                            }
                        },
                        {
                            label: 'Ne',
                            onClick: () => {}
                        }
                    ]
                });
            })
            .catch((err) => console.trace(err))
    }

    return (
        <main className='App'>
            <Sidebar />
            <h1><Link className='customLink' to='/'>WebDBKLP</Link></h1>
            <AddBook saveBook={handleSaveBook} />
            {books.sort((a,b) => a.title.localeCompare(b.title)).map((book: IBook) => {
                return <BookItem
                    key={book._id}
                    updateBook={handleUpdateBook}
                    deleteBook={handleDeleteBook}
                    book={book}
                />
            })}
            <Toast />
        </main>
    );
}