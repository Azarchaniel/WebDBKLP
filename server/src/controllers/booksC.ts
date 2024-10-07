import {Response, Request} from 'express';
import {IBook, IPopulateOptions} from '../types';
import Book from '../models/book';
import {IUser} from '../types';
import User from '../models/user';
import { optionFetchAllExceptDeleted } from '../utils/constants';
import {webScrapper} from "../utils";
import mongoose from 'mongoose';

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
            .find(optionFetchAllExceptDeleted)
            .populate(populateOptions)
            .exec();
        const count: number = await Book.countDocuments(optionFetchAllExceptDeleted)
        res.status(200).json({books, count})
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

const getInfoFromISBN = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            params: {isbn}
        } = req;

        console.log("controller/getInfoFromISBN");
        const bookInfo = await webScrapper(isbn);

        res.status(200).json(bookInfo);
    } catch(err) {
        throw "Problem at web scrapping: " + err;
    }
}

const dashboard = {
    countBooks: async (req: Request, res: Response): Promise<void> => {
        try {
            const {
                params: {userId}
            } = req

            let users: IUser[] = await User.find({});
            let response: {owner: {id: string, firstName: string, lastName: string} | null, count: number}[] = [];

           if (userId) {
                const currUser: IUser | undefined = users.find(u => u._id === userId);
                if (!currUser) throw Error("User not found");

                response.push({
                    owner: {id: userId, firstName: currUser.firstName ?? "", lastName: currUser.lastName}, 
                    count: await Book.countDocuments({owner: userId})
                });
            } else {
                let tempRes = [];
                for (let user of users) {
                    tempRes.push(
                        {
                            owner: {id: user._id, firstName: user.firstName ?? "", lastName: user.lastName},
                            count: await Book.countDocuments({owner: user._id})
                        }
                    )
                }

                const query: mongoose.FilterQuery<IBook> = {
                    $or: [
                        { owner: { $exists: false } },
                        { owner: { $size: 0 } as any }
                      ]
                }

                tempRes.push(
                    {
                        owner: {id: '', firstName: '', lastName: ''},
                        count: await Book.countDocuments(query)
                    }
                )

                response = tempRes;
            }

            response.push({owner: null, count: await Book.countDocuments()});
            response.sort((a,b) => {
                if (a.owner === null || b.owner === null) return 0
                return a.owner?.lastName?.localeCompare(b.owner?.lastName)
            });

            res.status(200).json(response);
        } catch (error) {
            throw error;
        }
    }
}

export {getAllBooks, addBook, updateBook, deleteBook, getBook, dashboard, getInfoFromISBN}
