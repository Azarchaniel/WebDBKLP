import { Request, Response } from "express";
import {IPopulateOptions, IQuote, IUser} from "../types";
import Quote from "../models/quote"
import { optionFetchAllExceptDeleted } from "../utils/constants";
import User from "../models/user";

const populateOptions: IPopulateOptions[] = [
    { path: 'fromBook', model: 'Book', populate: {path: 'autor', model: 'Autor'} },
    { path: 'owner', model: 'User' }
];

const getBooksFromQuotes = (quotes: IQuote[]): (string | undefined)[] => {
    const bookIdsSet = new Set(
        quotes.map(quote => quote.fromBook?._id?.toString()).filter(Boolean)
    );
    return Array.from(bookIdsSet);
}

const getAllQuotes = async (req: Request, res: Response): Promise<void> => {
    try {
        let { activeUsers } = req.query;

        const query: any = { ...optionFetchAllExceptDeleted };

        if (activeUsers) {
            query.owner = { $in: activeUsers };
        }

        const quotes: IQuote[] = await Quote.find(query)
            .populate(populateOptions)
            .exec();

        const count = await Quote.countDocuments(query);

        const bookIds = getBooksFromQuotes(quotes);

        res.status(200).json({ quotes, count, bookIds })
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
            console.log(req.body);
            const quote: IQuote = new Quote({
                text: text,
                note: note,
                fromBook: fromBook[0]._id,
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
                {
                    ...req.body,
                    fromBook: req.body.fromBook[0]
                }
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