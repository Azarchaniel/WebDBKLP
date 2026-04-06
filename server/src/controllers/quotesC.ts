import { Request, Response } from "express";
import { IPopulateOptions, IQuote, IBook } from "../types";
import Quote from "../models/quote"
import { optionFetchAllExceptDeleted } from "../utils/constants";
import diacritics from "diacritics";

const populateOptions: IPopulateOptions[] = [
    {
        path: 'fromBook',
        model: 'Book',
        select: 'title autor published',
        populate: { path: 'autor', model: 'Autor' }
    },
    { path: 'owner', model: 'User' }
];

const getAllQuotes = async (req: Request, res: Response): Promise<void> => {
    try {
        let { activeUsers, filterByBook, search, page, limit } = req.query;

        const pageNum = Math.max(1, parseInt((page as string) || '1', 10));
        const limitNum = Math.min(100, Math.max(1, parseInt((limit as string) || '20', 10)));
        const skip = (pageNum - 1) * limitNum;

        const query: any = { ...optionFetchAllExceptDeleted };

        if (activeUsers) {
            query.owner = { $in: activeUsers };
        }

        if (filterByBook) {
            query.fromBook = { $in: filterByBook };
        }

        if (search && typeof search === 'string' && search.trim()) {
            const normalizedSearch = diacritics.remove(search.trim());
            query['normalizedSearchField.text'] = { $regex: normalizedSearch, $options: 'i' };
        }

        const [quotes, count] = await Promise.all([
            Quote.find(query)
                .populate(populateOptions)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .exec(),
            Quote.countDocuments(query)
        ]);

        const hasMore = skip + limitNum < count;

        // Return available books for the filter only on the first page,
        // querying without search/filterByBook so the dropdown always shows all quoted books.
        let onlyQuotedBooks: IBook[] | undefined;
        if (pageNum === 1) {
            const booksQuery: any = { ...optionFetchAllExceptDeleted };
            if (activeUsers) booksQuery.owner = { $in: activeUsers };

            const allQuotesForBooks: IQuote[] = await Quote.find(booksQuery)
                .populate({
                    path: 'fromBook',
                    model: 'Book',
                    select: 'title autor published',
                    populate: { path: 'autor', model: 'Autor' }
                })
                .select('fromBook')
                .exec();

            const bookMap = new Map<string, IBook>();
            allQuotesForBooks.forEach(q => {
                if (q.fromBook?._id) {
                    bookMap.set(q.fromBook._id.toString(), q.fromBook);
                }
            });
            onlyQuotedBooks = Array.from(bookMap.values())
                .sort((a: IBook, b: IBook) => a.title.localeCompare(b.title, "sk"));
        }

        res.status(200).json({ quotes, count, onlyQuotedBooks, hasMore });
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
                fromBook: fromBook[0]?._id,
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

            res.status(201).json({
                message: 'Quote updated',
                quote: updateQuote
            });
        }
    } catch (err) {
        console.error("Error while adding/updating Quote: ", err)
    }
};

const deleteQuote = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            params: { id },
        } = req
        const deletedQuote: IQuote | null = await Quote.findByIdAndUpdate(
            { _id: id },
            {
                deletedAt: new Date()
            }
        )

        res.status(200).json({
            message: 'Quote deleted',
            quote: deletedQuote
        })
    } catch (error) {
        throw error
    }
}

export { getAllQuotes, getQuote, addQuote, deleteQuote };