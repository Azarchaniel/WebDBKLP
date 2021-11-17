import {Router} from 'express'
import {getAllBooks, addBook, updateBook, deleteBook, getBook} from '../controllers/books'
import {addAutor, deleteAutor, getAllAutors, getAutor, updateAutor} from "../controllers/autors";
import {addQuote, deleteQuote, getAllQuotes, getQuote, updateQuote} from "../controllers/quotes";

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


export default router;
