import {Router} from 'express'
import type {Request, Response, NextFunction} from 'express';
import {
    getAllBooks,
    addBook,
    updateBook,
    deleteBook,
    getBook,
    dashboard,
    getInfoFromISBN,
    getBooksByIds,
    getAllAutorsBooks,
    loginUser,
    refreshToken,
} from '../controllers'
import {addAutor, deleteAutor, getAllAutors, getAutor, updateAutor} from "../controllers";
import {addQuote, deleteQuote, getAllQuotes, getQuote} from "../controllers";
import {getAllUsers, getUser} from "../controllers";
import {addLp, deleteLp, getAllLps, getLp} from "../controllers";
import {userVerification} from "../middleware";

const router: Router = Router()

router.use((req: Request, res: Response, next: NextFunction) => {
    const publicRoutes = ['/login', '/refresh-token'];

    if (publicRoutes.includes(req.path)) {
        return next();
    }

    userVerification(req, res, next);
})

// ### USER ###
router.post('/login', loginUser)
router.post('/refresh-token', refreshToken)

// ### BOOKS ###
router.get('/book/:id', getBook)
router.get('/books', getAllBooks)
router.post('/add-book', addBook)
router.put('/edit-book/:id', updateBook)
router.post('/delete-book/:id', deleteBook)
router.get('/get-book-info/:isbn', getInfoFromISBN)
router.get('/books-by-ids', getBooksByIds)

// ### AUTORS ###
router.get('/autor/:id', getAutor)
router.get('/autors', getAllAutors)
router.post('/add-autor', addAutor)
router.put('/edit-autor/:id', updateAutor)
router.post('/delete-autor/:id', deleteAutor)
router.get('/get-autor-info/:id', getAllAutorsBooks)

// ### QUOTES ###
router.get('/quote/:id', getQuote)
router.get('/quotes', getAllQuotes)
router.post('/add-quote', addQuote)
router.post('/delete-quote/:id', deleteQuote)

// ### USERS ###
router.get('/user/:id', getUser)
router.get('/users', getAllUsers)

// ### LP ###
router.get('/lp/:id', getLp)
router.get('/lps', getAllLps)
router.post('/add-lp', addLp)
router.post('/delete-lp/:id', deleteLp)

router.get('/webScrapper',)

// ### DASHBOARD ###
router.get('/count-books/:id', dashboard.countBooks)
router.get('/get-dimensions-statistics', dashboard.getDimensionsStatistics)
router.get('/get-language-statistics', dashboard.getLanguageStatistics)
router.get('/get-size-groups', dashboard.getSizesGroups)
router.get('/get-read-by', dashboard.getReadBy)

export default router;
