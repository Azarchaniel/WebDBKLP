import {Router} from 'express'
import {getAllBooks, addBook, updateBook, deleteBook, getBook} from '../controllers/books'
import {addAutor, deleteAutor, getAllAutors, getAutor, updateAutor} from "../controllers/autors";


const router: Router = Router()

// ### BOOKS ###
router.get('/book/:id', getBook)
router.get('/books', getAllBooks)
router.post('/add-book', addBook)
router.put('/edit-book/:id', updateBook)
router.delete('/delete-book/:id', deleteBook)

// ### AUTORS ###
router.get('/autor/:id', getAutor)
router.get('/autors', getAllAutors)
router.post('/add-autor', addAutor)
router.put('/edit-autor/:id', updateAutor)
router.delete('/delete-autor/:id', deleteAutor)

export default router;
