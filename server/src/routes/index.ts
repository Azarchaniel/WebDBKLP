import {Router} from 'express'
import {getAllBooks, addBook, updateBook, deleteBook, getBook, dashboard, getInfoFromISBN} from '../controllers'
import {addAutor, deleteAutor, getAllAutors, getAutor, updateAutor} from "../controllers";
import {addQuote, deleteQuote, getAllQuotes, getQuote} from "../controllers";
import {getAllUsers, getUser} from "../controllers";
import {addLp, deleteLp, getAllLps, getLp, updateLp} from "../controllers";

const router: Router = Router()

// ### BOOKS ###
router.get('/book/:id', getBook)
router.get('/books', getAllBooks)
router.post('/add-book', addBook)
router.put('/edit-book/:id', updateBook)
router.post('/delete-book/:id', deleteBook)
router.get('/get-book-info/:isbn', getInfoFromISBN)

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
router.post('/delete-quote/:id', deleteQuote)

// ### USERS ###
router.get('/user/:id', getUser)
router.get('/users', getAllUsers)

// ### QUOTES ###
router.get('/lp/:id', getLp)
router.get('/lps', getAllLps)
router.post('/add-lp', addLp)
router.put('/edit-lp/:id', updateLp)
router.post('/delete-lp/:id', deleteLp)

router.get('/webScrapper', )

router.get('/count-books/:id', dashboard.countBooks)

export default router;
