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
import {toast, ToastContainer, Slide} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.scss'

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
      .catch((err: Error) => console.log(err))
    }

    const handleSaveBook = (e: React.FormEvent, formData: IBook): void => {
      e.preventDefault()
      addBook(formData)
      .then(({ status, data }) => {
          if (status !== 201) {
          throw new Error('Error! Todo not saved')
        }
        setBooks(data.books)
      })
      .catch((err) => console.log(err))
    }

    const handleUpdateBook = (book: IBook): void => {
      updateBook(book)
      .then(({ status, data }) => {
          if (status !== 200) {
            throw new Error('Error! Todo not updated')
          }
          setBooks(data.books)
        })
        .catch((err) => console.log(err))
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
                                          toast.error('Doslo k chybe!');
                                          console.log(err);
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
            .catch((err) => console.log(err))
    }

    // ### AUTORS ###
    const fetchAutors = (): void => {
        getAutors()
            .then(({ data: { autors } }: IAutor[] | any) => {
                setAutors(autors);
            })
            .catch((err: Error) => console.log(err))
    }

    const handleSaveAutor = (e: React.FormEvent, formData: IAutor): void => {
        e.preventDefault()
        addAutor(formData)
            .then(({ status, data }) => {
                if (status !== 201) {
                    throw new Error('Error! Todo not saved')
                }
                setAutors(data.autors);
            })
            .catch((err) => console.log(err))
    }

    const handleUpdateAutor = (autor: IAutor): void => {console.log(autor)}

    const handleDeleteAutor = (_id: string): void => {
        getAutor(_id)
            .then(({ status, data }) => {
                if (status !== 200) {
                    toast.error('Doslo k chybe!');
                    throw new Error('Chyba! Autor nevymazany.')
                }
                console.log(data);
                const autorNames = `${data.autor?.lastName}, ${data.autor?.lastName}`;

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
                                        console.log(err);
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
            .catch((err) => console.log(err))

    }

  return (
    <main className='App'>
      <h1>My Books</h1>
      <AddBook saveBook={handleSaveBook} />
      <AddAutor saveAutor={handleSaveAutor}/>
      {books.map((book: IBook) => (
        <BookItem
          key={book._id}
          updateBook={handleUpdateBook}
          deleteBook={handleDeleteBook}
          book={book}
        />
      ))}
        {autors.map((autor: IAutor) => (
            <AutorItem
                key={autor._id}
                updateAutor={handleUpdateAutor}
                deleteAutor={handleDeleteAutor}
                autor={autor}
            />
        ))}
        <ToastContainer
            position="bottom-center"
            autoClose={3000}
            transition={Slide}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
        />
    </main>
  )
};

export default App;
