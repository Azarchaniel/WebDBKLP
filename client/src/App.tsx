import React, { useEffect, useState } from 'react';
import BookItem from './components/BookItem'
import AddBook from './components/AddBook'
import {getBooks, addBook, updateBook, deleteBook, getBook, addAutor, getAutors, getAutor, deleteAutor} from './API'
import {IBook} from "./type";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import AddAutor from "./components/AddAutor";
import {IAutor} from "../../server/src/types";
import AutorItem from "./components/AutorItem";
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.scss'
import Toast from "./components/Toast";
import Sidebar from "./components/sidebar";

const App: React.FC = () => {
    const [books, setBooks] = useState<IBook[]>([]);
    const [autors, setAutors] = useState<IAutor[]>([]);

    useEffect(() => {
      fetchBooks();
      fetchAutors();
    }, [])

        // ### BOOKS ###
    const fetchBooks = (): void => {
      getBooks()
      .then(({ data: { books } }: IBook[] | any) => {
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

    // ### AUTORS ###
    const fetchAutors = (): void => {
        getAutors()
            .then(({ data: { autors } }: IAutor[] | any) => {
                setAutors(autors);
            })
            .catch((err: Error) => console.trace(err))
    }

    const handleSaveAutor = (e: React.FormEvent, formData: IAutor): void => {
        e.preventDefault()
        addAutor(formData)
            .then(({ status, data }) => {
                if (status !== 201) {
                    throw new Error('Error! Todo not saved')
                }
                const autorNames = `${data.autor?.lastName}${data.autor?.firstName ? ', ' + data.autor?.firstName : ''}`;
                toast.success(`Autor ${autorNames} bol uspesne pridany.`);
                setAutors(data.autors);
            })
            .catch((err) => {
                toast.error(`Autora sa nepodarilo pridat!`);
                console.trace(err);
            })
    }

    const handleUpdateAutor = (autor: IAutor): void => {console.trace(autor)}

    const handleDeleteAutor = (_id: string): void => {
        getAutor(_id)
            .then(({ status, data }) => {
                if (status !== 200) {
                    toast.error('Doslo k chybe!');
                    throw new Error('Chyba! Autor nevymazany.')
                }
                const autorNames = `${data.autor?.lastName}${data.autor?.firstName ? ', ' + data.autor?.firstName : ''}`;

                confirmAlert({
                    title: 'Vymazat autora?',
                    message: `Naozaj chces vymazat autora ${autorNames}?`,
                    buttons: [
                        {
                            label: 'Ano',
                            onClick: () => {
                                deleteAutor(_id)
                                    .then(({ status, data }) => {
                                        if (status !== 200) {
                                            throw new Error('Error! Autor not deleted')
                                        }
                                        toast.success(`Autor ${autorNames} bol uspesne vymazany.`);
                                        setAutors(data.autors)
                                    })
                                    .catch((err) => {
                                        toast.error('Doslo k chybe!');
                                        console.trace(err);
                                    })
                            }
                        },
                        {
                            label: 'Ne',
                            onClick: () => {}
                        }
                    ],
                });
            })
            .catch((err) => console.trace(err))

    }

  return (
    <main className='App'>
        <Sidebar />
      <h1>WebDBKLP</h1>
      <AddBook saveBook={handleSaveBook} />
      <AddAutor saveAutor={handleSaveAutor}/>
      {books.sort((a,b) => a.title.localeCompare(b.title)).map((book: IBook) => (
        <BookItem
          key={book._id}
          updateBook={handleUpdateBook}
          deleteBook={handleDeleteBook}
          book={book}
        />
      ))}
        {/*todo: sorting and better fetching anyway*/}
        {autors.sort((a,b) => a.lastName.localeCompare(b.lastName)).map((autor: IAutor) => (
            <AutorItem
                key={autor._id}
                updateAutor={handleUpdateAutor}
                deleteAutor={handleDeleteAutor}
                autor={autor}
            />
        ))}
        <Toast />
    </main>
  )
};

export default App;
