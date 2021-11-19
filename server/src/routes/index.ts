import {Router} from 'express'
import {getAllBooks, addBook, updateBook, deleteBook, getBook} from '../controllers'
import {addAutor, deleteAutor, getAllAutors, getAutor, updateAutor} from "../controllers";
import {addQuote, deleteQuote, getAllQuotes, getQuote, updateQuote} from "../controllers";
import {getAllUsers, getUser} from "../controllers";

const router: Router = Router()

// ### BOOKS ###
router.get('/book/:id', getBook)
router.get('/books', getAllBooks)
router.post('/add-book', addBook)
router.put('/edit-book/:id', updateBook)
router.post('/delete-book/:id', deleteBook)

// ### AUTORS ###
router.get('/autor/:id', getAutor)
router.get('/autors', getAllAutors)
router.post('/add-autor', addAutor)
router.put('/edit-autor/:id', updateAutor)
router.post('/delete-autor/:id', deleteAutor)

// ### QUOTES ###
router.get('/quote/:id', getQuote)
router.get('/quotes', getAllQuotes)
router.post('/add-quote', addQuote)
router.put('/edit-quote/:id', updateQuote)
router.post('/delete-quote/:id', deleteQuote)

// ### USERS ###
router.get('/user/:id', getUser)
router.get('/users', getAllUsers)

export default router;
