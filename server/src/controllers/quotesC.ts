import { Request, Response } from "express";
import { IPopulateOptions, IQuote, IBook } from "../types";
import Quote from "../models/quote"
import { optionFetchAllExceptDeleted } from "../utils/constants";
import { buildSearchQuery } from "../utils/queryUtils";

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
        let { activeUsers, filterByBook, search, page, limit, dataFrom, syncMode } = req.query;

        const pageNum = Math.max(1, parseInt((page as string) || '1', 10));
        // syncMode=true is set only by the PWA background cache — bypass the UI pagination cap.
        const isSyncMode = syncMode === 'true';
        const limitNum = isSyncMode ? 100_000 : Math.min(100, Math.max(1, parseInt((limit as string) || '20', 10)));
        const skip = (pageNum - 1) * limitNum;

        // Compute latestUpdate only when needed (sync or incremental refresh)
        const needsLatestUpdate = !!dataFrom || isSyncMode;
        const latestDoc = needsLatestUpdate ? await Quote.findOne({ ...optionFetchAllExceptDeleted })
            .sort({ updatedAt: -1 })
            .select('updatedAt')
            .lean()
            .exec()
            : null;
        const latestUpdate: string | undefined = latestDoc?.updatedAt
            ? (latestDoc.updatedAt as any).toISOString?.() ?? String(latestDoc.updatedAt)
            : undefined;

        // If caller already has fresh data, return early (204-style but with JSON so axios doesn't choke)
        if (dataFrom && latestUpdate && new Date(dataFrom as string) >= new Date(latestUpdate)) {
            res.status(200).json({ quotes: [], count: 0, hasMore: false, latestUpdate });
            return;
        }

        const query: any = { ...optionFetchAllExceptDeleted };

        if (activeUsers) {
            query.owner = { $in: activeUsers };
        }

        if (filterByBook) {
            query.fromBook = { $in: filterByBook };
        }

        Object.assign(query, buildSearchQuery(search as string, ['text']));

        const [quotePage] = await Quote.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    quotes: [
                        { $skip: skip },
                        { $limit: limitNum },
                        { $project: { _id: 1 } }
                    ],
                    count: [{ $count: "count" }]
                }
            }
        ]);

        const quoteIds = quotePage?.quotes?.map((quote: IQuote) => quote._id) ?? [];
        const count = quotePage?.count?.[0]?.count ?? 0;
        const populatedQuotes = await Quote.find({ _id: { $in: quoteIds } })
            .populate(populateOptions)
            .exec();
        const quotesById = new Map(populatedQuotes.map(quote => [quote._id.toString(), quote]));
        const quotes = quoteIds.map((id: any) => quotesById.get(id.toString())).filter(Boolean);

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

        res.status(200).json({ quotes, count, onlyQuotedBooks, hasMore, latestUpdate });
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