import {Response, Request} from 'express';
import {IBook, IPopulateOptions} from '../types';
import Book from '../models/book';
import {IUser} from '../types';
import User from '../models/user';

const populateOptions: IPopulateOptions[] = [
    {path: 'autor', model: 'Autor'},
    {path: 'editor', model: 'Autor'},
    {path: 'ilustrator', model: 'Autor'},
    {path: 'translator', model: 'Autor'},
    {path: 'owner', model: 'User'},
    {path: 'readBy', model: 'User'}
];

const getAllBooks = async (_: Request, res: Response): Promise<void> => {
    try {
        //remember: when populating, and NameOfField != Model, define it with {}
        const books: IBook[] = await Book
            .find()
            .populate(populateOptions)
            .exec();
        res.status(200).json({books: books})
    } catch (error) {
        throw error
    }
}

const getBook = async (req: Request, res: Response): Promise<void> => {
    try {
        const book = await Book
            .findById(req.params.id)
            .populate(populateOptions)
            .exec();
        const allBooks: IBook[] = await Book
            .find()
            .populate(populateOptions)
            .exec()
        res.status(200).json({book: book, books: allBooks})
    } catch (err) {
        throw err;
    }
}

const addBook = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            published, location
        } = req.body;
        console.trace(req.body);

        const book: IBook = new Book({
            published: {
                publisher: published?.publisher,
                year: published?.year ?? undefined,
                country: published?.country ?? ''
            },
            location: {
                city: location?.city,
                shelf: location?.shelf,
            },
            ...req.body,
        })

        const newBook: IBook = await book.save()
        const allBooks: IBook[] = await Book
            .find()
            .populate(populateOptions)
            .exec();

        res.status(201).json({message: 'Book added', book: newBook, books: allBooks})
    } catch (error) {
        throw error
    }
}

const updateBook = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            params: {id},
            body,
        } = req
        const updateBook: IBook | null = await Book.findByIdAndUpdate(
            {_id: id},
            body
        )
        const allBooks: IBook[] = await Book
            .find()
            .populate(populateOptions)
            .exec();

        res.status(200).json({
            message: 'Book updated',
            book: updateBook,
            books: allBooks,
        })
    } catch (error) {
        throw error
    }
}

const deleteBook = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            params: {id},
            body,
        } = req
        const deletedBook: IBook | null = await Book.findByIdAndUpdate(
            {_id: id},
            {
                ...body,
                deletedAt: new Date()
            }
        )
        const allBooks: IBook[] = await Book
            .find()
            .populate(populateOptions)
            .exec();

        res.status(200).json({
            message: 'Book deleted',
            book: deletedBook,
            books: allBooks,
        })
    } catch (error) {
        throw error
    }
}

const dashboard = {
    countBooks: async (req: Request, res: Response): Promise<void> => {
        try {
            const {
                params: {id},
                body,
            } = req

            let countedBooks: number = 0;
            let user: IUser | null = null;

            if (id === "undefined") {
                countedBooks = await Book
                    .countDocuments();
            } else if(id === "") {
                //TODO: return every book with no Owner
            } else {
                user = await User.findById(req.params.id);
                countedBooks = await Book
                    .find({owner: id})
                    .countDocuments();
            } 
            
            res.status(200).json({
                owner: user?.firstName ?? "",
                count: countedBooks
            })
        } catch (error) {
            throw error;
        }
    }
}

export {getAllBooks, addBook, updateBook, deleteBook, getBook, dashboard}
