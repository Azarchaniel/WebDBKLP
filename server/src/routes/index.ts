import {Router} from 'express'
import {getAllBooks, addBook, updateBook, deleteBook, getBook} from '../controllers/books'

const router: Router = Router()

router.get('/book/:id', getBook)
router.get('/books', getAllBooks)
router.post('/add-book', addBook)
router.put('/edit-book/:id', updateBook)
router.delete('/delete-book/:id', deleteBook)

export default router
