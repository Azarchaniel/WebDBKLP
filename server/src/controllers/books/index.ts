import {Response, Request} from 'express'
import {IBook} from '../../types'
import Book from '../../models/book'

const getAllBooks = async (req: Request, res: Response): Promise<void> => {
    try {
        const books: IBook[] = await Book.find()

        res.status(200).json({books: books})
    } catch (error) {
        throw error
    }
}

const getBook = async (req: Request, res: Response): Promise<void> => {
    try {
        const book = await Book.findById(req.params.id);
        const allBooks: IBook[] = await Book.find()
        res.status(200).json({book: book, books: allBooks})
    } catch (err) {
        throw err;
    }
}

const addBook = async (req: any, res: any): Promise<void> => {
    try {
        const body = req.body as Pick<IBook, 'title' | 'subtitle' | 'ISBN' | 'language' | 'note' | 'numberOfPages' | 'published' >

        const book: IBook = new Book({
            title: body.title,
            subtitle: body.subtitle,
            ISBN: body.ISBN,
            language: body.language,
            note: body.note,
            numberOfPages: body.numberOfPages,
            published: {
                publisher: body.published?.publisher,
                year: body.published?.year ?? undefined,
                country: body.published?.country ?? ''
            },
        })

        const newBook: IBook = await book.save()
        const allBooks: IBook[] = await Book.find()

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
        const allBooks: IBook[] = await Book.find()
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
        const deletedBook: IBook | null = await Book.findByIdAndRemove(
            req.params.id
        )
        const allBooks: IBook[] = await Book.find()
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
