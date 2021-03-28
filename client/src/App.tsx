import React, { useEffect, useState } from 'react'
import BookItem from './components/BookItem'
import AddBook from './components/AddBook'
import {getBooks, addBook, updateBook, deleteBook, getBook} from './API'
import {IBook} from "./type";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import AddAutor from "./components/AddAutor";
import {IAutor} from "../../server/src/types";

const App: React.FC = () => {
  const [books, setBooks] = useState<IBook[]>([]);

  useEffect(() => {
    fetchBooks()
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
     console.log('handleSaveBook',formData);
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
                                      setBooks(data.books)
                                  })
                                  .catch((err) => console.log(err))
                          }
                      },
                      {
                          label: 'Ne',
                          onClick: () => {}
                      }
                  ]
              });

              setBooks(data.books)
          })
          .catch((err) => console.log(err))
  }

  // ### AUTORS ###
    const handleSaveAutor = (e: React.FormEvent, formData: IAutor): void => {
        e.preventDefault()
        console.log('handleSaveAutor',formData);
        /*addBook(formData)
            .then(({ status, data }) => {
                if (status !== 201) {
                    throw new Error('Error! Todo not saved')
                }
                setBooks(data.books)
            })
            .catch((err) => console.log(err))*/
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

    </main>
  )
}

export default App;
