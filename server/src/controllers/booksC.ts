import {Response, Request} from 'express';
import {IBook} from '../types';
import Book from '../models/book';
import {loadavg} from "os";

const getAllBooks = async (req: Request, res: Response): Promise<void> => {
    try {
        //remember: when populating, and NameOfField != Model, define it with {}
        //todo: populate also editor, translator...
        const books: IBook[] = await Book
            .find()
            .populate([
                {path: 'autor', model: 'Autor'},
                {path: 'owner', model: 'User'},
                {path: 'readBy', model: 'User'}
            ])
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
            .populate([
                {path: 'autor', model: 'Autor'},
                {path: 'owner', model: 'User'},
                {path: 'readBy', model: 'User'}
            ])
            .exec();
        const allBooks: IBook[] = await Book.find().populate([
            {path: 'autor', model: 'Autor'},
            {path: 'owner', model: 'User'},
            {path: 'readBy', model: 'User'}
        ]).exec()
        res.status(200).json({book: book, books: allBooks})
    } catch (err) {
        throw err;
    }
}

const addBook = async (req: Request, res: Response): Promise<void> => {
    try {
        //todo: there has to be a better way for cleaner code
        const {
            title, subtitle, ISBN, language, note, numberOfPages,
            published, autor, owner, exLibris, readBy, location
        } = req.body;
        console.trace(req.body);

        const book: IBook = new Book({
            autor: autor,
            title: title,
            subtitle: subtitle,
            ISBN: ISBN,
            language: language,
            note: note,
            numberOfPages: numberOfPages,
            published: {
                publisher: published?.publisher,
                year: published?.year ?? undefined,
                country: published?.country ?? ''
            },
            location: {
                city: location?.city,
                shelf: location?.shelf,
            },
            owner: owner,
            exLibris: exLibris,
            readBy: readBy
        })

        const newBook: IBook = await book.save()
        const allBooks: IBook[] = await Book.find().populate([
            {path: 'autor', model: 'Autor'},
            {path: 'owner', model: 'User'},
            {path: 'readBy', model: 'User'}
        ]).exec();

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
        const allBooks: IBook[] = await Book.find().populate([
            {path: 'autor', model: 'Autor'},
            {path: 'owner', model: 'User'},
            {path: 'readBy', model: 'User'}
        ]).exec();

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
                isDeleted: true
            }
        )
        const allBooks: IBook[] = await Book.find().populate([
            {path: 'autor', model: 'Autor'},
            {path: 'owner', model: 'User'},
            {path: 'readBy', model: 'User'}
        ]).exec();

        res.status(200).json({
            message: 'Book deleted',
            book: deletedBook,
            books: allBooks,
        })
    } catch (error) {
        throw error
    }
}

export {getAllBooks, addBook, updateBook, deleteBook, getBook}
