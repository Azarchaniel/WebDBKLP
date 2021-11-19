import {Request, Response} from "express";
import {IQuote} from "../types";
import Quote from "../models/quote"

const getAllQuotes = async (req: Request, res: Response): Promise<void> => {
    try {
        const quotes: IQuote[] = await Quote.find().populate('books').exec();
        res.status(200).json({quotes: quotes})
    } catch (error) {
        res.status(400);
        throw error
    }
}

const getQuote = async (req: Request, res: Response): Promise<void> => {
    try {
        const quote: IQuote | null = await Quote.findById(req.params.id).populate('book').exec();
        const allQuotes: IQuote[] = await Quote.find().populate('book').exec();
        //todo: do I need allQuotes and allAuthors...?
        res.status(200).json({quote: quote, quotes: allQuotes});
    } catch (err) {
        throw err;
    }
}

const addQuote = async (req: Request, res: Response): Promise<void> => {
    const {text, fromBook, isDeleted} = req.body;

    try {
        const quote: IQuote = new Quote({
           text: text,
            fromBook: fromBook[0],
            isDeleted: isDeleted
        });

        const newQuote: IQuote = await quote.save();
        const allQuotes: IQuote[] = await Quote.find();
        res.status(201).json({message: 'Quote added', quote: newQuote, quotes: allQuotes})
    } catch (error) {
        throw error
    }
}

const updateQuote = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            params: {id},
            body,
        } = req
        const updateQuote: IQuote | null = await Quote.findByIdAndUpdate(
            {_id: id},
            body
        )
        const allQuotes: IQuote[] = await Quote.find()
        res.status(200).json({
            message: 'Quote updated',
            Autor: updateQuote,
            Autors: allQuotes,
        })
    } catch (error) {
        throw error
    }
}

const deleteQuote = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            params: {id},
            body,
        } = req
        const deletedQuote: IQuote | null = await Quote.findByIdAndUpdate(
            {_id: id},
            {
                ...body,
                isDeleted: true
            }
        )
        const allQuote: IQuote[] = await Quote.find()
        res.status(200).json({
            message: 'Quote deleted',
            autor: deletedQuote,
            autors: allQuote,
        })
    } catch (error) {
        throw error
    }
}

export {getAllQuotes, getQuote, addQuote, updateQuote, deleteQuote};