import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express';
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
    checkBooksUpdated,
    getPageByStartingLetter,
    getUniqueFieldValues,
    getBoardGame,
    getAllBoardGames,
    addBoardGame,
    updateBoardGame,
    deleteBoardGame,
    countBGchildren, logoutUser,
    getMultipleAutorsInfo
} from '../controllers'
import { addAutor, deleteAutor, getAllAutors, getAutor, updateAutor } from "../controllers";
import { addQuote, deleteQuote, getAllQuotes, getQuote } from "../controllers";
import { getAllUsers, getUser } from "../controllers";
import { addLp, deleteLp, getAllLps, getLp } from "../controllers";
import { userVerification } from "../middleware";

const router: Router = Router()

router.use((req: Request, res: Response, next: NextFunction) => {
    // Routes that don't require authentication
    const publicRoutes = ['/login', '/refresh-token'];

    // Allow GET requests to these base paths without authentication
    const publicGetPaths = [
        '/books',
        '/autors',
        '/book/',
        '/autor/',
        '/lps',
        '/lp/',
        '/boardgames',
        '/boardgame/',
        '/quotes',
        '/quote/'
    ];

    // Check if it's a public route or a GET request to a public path
    if (
        publicRoutes.includes(req.path) ||
        (req.method === 'GET' && publicGetPaths.some(path => req.path.startsWith(path)))
    ) {
        return next();
    }

    userVerification(req, res, next);
})

// ### USER ###
router.post('/login', loginUser)
router.post('/logout', logoutUser);
router.post('/refresh-token', refreshToken)

router.get('/get-page-by-starting-letter', getPageByStartingLetter)

// ### BOOKS ###
router.get('/book/:id', getBook)
router.get('/books', getAllBooks)
router.post('/add-book', addBook)
router.put('/edit-book/:id', updateBook)
router.post('/delete-book/:id', deleteBook)
router.get('/get-book-info/:isbn', getInfoFromISBN)
router.get('/books-by-ids', getBooksByIds)
router.get('/books/check-updated', checkBooksUpdated)
router.get('/books/get-unique-field-values', getUniqueFieldValues)

// ### AUTORS ###
router.get('/autor/:id', getAutor)
router.get('/autors', getAllAutors)
router.post('/add-autor', addAutor)
router.put('/edit-autor/:id', updateAutor)
router.post('/delete-autor/:id', deleteAutor)
router.get('/get-autor-info/:id', getAllAutorsBooks)
router.post('/get-multiple-autors-info', getMultipleAutorsInfo)

// ### QUOTES ###
router.get('/quote/:id', getQuote)
router.get('/quotes', getAllQuotes)
router.post('/add-quote', addQuote)
router.put('/edit-quote/:id', addQuote)
router.post('/delete-quote/:id', deleteQuote)

// ### USERS ###
router.get('/user/:id', getUser)
router.get('/users', getAllUsers)

// ### LP ###
router.get('/lp/:id', getLp)
router.get('/lps', getAllLps)
router.post('/add-lp', addLp)
router.put('/edit-lp/:id', addLp)
router.post('/delete-lp/:id', deleteLp)

// ### DASHBOARD ###
router.get('/count-books/:id', dashboard.countBooks)
router.get('/get-dimensions-statistics', dashboard.getDimensionsStatistics)
router.get('/get-language-statistics', dashboard.getLanguageStatistics)
router.get('/get-size-groups', dashboard.getSizesGroups)
router.get('/get-read-by', dashboard.getReadBy)

// ### BOARD GAMES ###
router.get('/boardgames', getAllBoardGames)
router.get('/boardgame/:id', getBoardGame)
router.post('/add-boardgame', addBoardGame)
router.put('/edit-boardgame/:id', updateBoardGame)
router.get('/boardgame/count-children/:id', countBGchildren)
router.post('/delete-boardgame/:id', deleteBoardGame)

export default router;
