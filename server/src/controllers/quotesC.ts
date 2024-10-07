import { Request, Response } from "express";
import { IPopulateOptions, IQuote } from "../types";
import Quote from "../models/quote"
import { optionFetchAllExceptDeleted } from "../utils/constants";

const populateOptions: IPopulateOptions[] = [
    { path: 'fromBook', model: 'Book' },
    { path: 'owner', model: 'User' }
];

const getAllQuotes = async (_: Request, res: Response): Promise<void> => {
    try {
        const quotes: IQuote[] =
            await Quote.find(optionFetchAllExceptDeleted)
                .populate(populateOptions)
                .exec();
        quotes.sort((a: IQuote, b: IQuote) => a.createdAt < b.createdAt ? 1 : -1);
        const count = await Quote.countDocuments(optionFetchAllExceptDeleted);
        res.status(200).json({ quotes, count })
    } catch (error) {
        res.status(500);
        console.error(error);
    }
}

const getQuote = async (req: Request, res: Response): Promise<void> => {
    try {
        const quote: IQuote | null = await Quote.findById(req.params.id)
            .populate(populateOptions)
            .exec();
        const allQuotes: IQuote[] = await Quote.find()
            .populate(populateOptions)
            .exec();
        res.status(200).json({ quote: quote, quotes: allQuotes });
    } catch (err) {
        throw err;
    }
}

const addQuote = async (req: Request, res: Response): Promise<void> => {
    const { id, text, fromBook, note, owner, pageNo } = req.body;

    try {
        if (!id) {
            const quote: IQuote = new Quote({
                text: text,
                note: note,
                fromBook: fromBook,
                owner: owner,
                pageNo: pageNo
            });

            const newQuote: IQuote = await quote.save();
            const allQuotes: IQuote[] = await Quote
                .find()
                .populate(populateOptions)
                .exec();
            res.status(201).json({ message: 'Quote added', quote: newQuote, quotes: allQuotes })
        } else {
            const updateQuote: IQuote | null = await Quote.findByIdAndUpdate(
                { _id: id },
                req.body
            )

            const allQuotes: IQuote[] = await Quote
                .find()
                .populate(populateOptions)
                .exec();
            res.status(201).json({
                message: 'Quote updated',
                quote: updateQuote,
                quotes: allQuotes,
            });
        }
    } catch (err) {
        console.error("Error while adding/updating Quote: ", err)
    }
};

const deleteQuote = async (req: Request, res: Response): Promise<void> => {
    console.log("AAAAAAAAAAAAAAAA");
    try {
        const {
            params: {id},
            body,
        } = req
        const deletedQuote: IQuote | null = await Quote.findByIdAndUpdate(
            {_id: id},
            {
                deletedAt: new Date()
            }
        )

        const allQuotes: IQuote[] = await Quote
            .find()
            .populate(populateOptions)
            .exec();

        res.status(200).json({
            message: 'Quote deleted',
            quote: deletedQuote,
            quotes: allQuotes,
        })
    } catch (error) {
        throw error
    }
}

export { getAllQuotes, getQuote, addQuote, deleteQuote };