import {Response, Request} from 'express';
import {IBook, IUser} from '../types';
import Book from '../models/book';
import User from '../models/user';
import {createLookupStage, formatMongoDbDecimal, getIdFromArray, sortByParam, webScrapper} from "../utils/utils";
import mongoose, {PipelineStage, Types} from 'mongoose';
import {populateOptionsBook} from "../utils/constants";
import diacritics from "diacritics";

const normalizeBook = (data: any): IBook => {
    const city = data.location ?
        Array.isArray(data.location?.city) ? data?.location?.city?.[0]?.value : data?.location?.city
        : null;
    const countryPublished = data.published ?
        Array.isArray(data.published?.country) ? data?.published?.country?.[0]?.key : data?.published?.country
        : null;

    return {
        autor: getIdFromArray(data.autor),
        editor: getIdFromArray(data.editor),
        translator: getIdFromArray(data.translator),
        ilustrator: getIdFromArray(data.ilustrator),
        readBy: getIdFromArray(data.readBy),
        owner: getIdFromArray(data.owner),
        published: {
            publisher: data.published?.publisher ?? "",
            year: data.published?.year ?? undefined,
            country: countryPublished
        },
        location: {
            city: city,
            shelf: data.location?.shelf ?? "",
        },
        language: data.language?.map((lang: { key: string; value: string }) => (lang?.key ?? lang)),
        numberOfPages: data.numberOfPages ? parseInt(data.numberOfPages) : undefined,
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        edition: {
            no: data.edition?.no,
            title: data.edition?.title
        },
        serie: {
            no: data.serie?.no,
            title: data.serie?.title
        },
        ISBN: data.ISBN,
        note: data.note,
        dimensions: {
            height: data.dimensions?.height ? formatMongoDbDecimal(data.dimensions?.height) : undefined,
            width: data.dimensions?.width ? formatMongoDbDecimal(data.dimensions?.width) : undefined,
            depth: data.dimensions?.depth ? formatMongoDbDecimal(data.dimensions?.depth) : undefined,
            weight: data.dimensions?.weight ? formatMongoDbDecimal(data.dimensions?.weight) : undefined
        },
        exLibris: data.exLibris,
        picture: data.picture,
        hrefGoodReads: data.hrefGoodReads,
        hrefDatabazeKnih: data.hrefDatabazeKnih,
        wasChecked: data.wasChecked //TEMPORARY
    } as unknown as IBook
}

const getAllBooks = async (req: Request, res: Response): Promise<void> => {
    try {
        let {page, pageSize, search = "", sorting, filterUsers} = req.query;

        // Set default pagination values if not provided
        if (!page) page = "1";
        if (!pageSize) pageSize = "10_000";

        // Parse sorting parameters
        let sortParams: Array<{ id: string; desc: string }> = [];
        if (typeof sorting === "string") {
            sortParams = JSON.parse(sorting);
        } else if (Array.isArray(sorting)) {
            sortParams = sorting as Array<{ id: string; desc: string }>;
        }

        // Build the sort object for MongoDB
        const sortOptions: { [key: string]: 1 | -1 } = {};
        if (sortParams.length > 0) {
            sortParams.forEach((param) => {
                sortOptions[param.id] = param.desc === "true" ? -1 : 1;
            });
        } else {
            // Default sorting if no sorting parameters are provided
            sortOptions["title"] = 1;
        }

        // Handle filterUsers
        let query: Record<string, any> = {deletedAt: {$eq: null}};
        if (filterUsers) {
            query = {...query, owner: {$in: (filterUsers as string[]).map(userId => new Types.ObjectId(userId))}};
        }

        const normalizedSearchFields = [
            "autor", "editor", "ilustrator", "translator", "title", "subtitle", "content", "edition", "serie", "note", "published", "ISBN"
        ];

        // Add search conditions to the query if a search term is provided
        if (search) {
            query = {
                ...query,
                $or: normalizedSearchFields.map(field => ({
                    [`normalizedSearchField.${field}`]: {$regex: diacritics.remove(search as string).replace(/-/g, ""), $options: "i"}
                }))
            };
        }

        // Aggregation pipeline
        const pipeline: PipelineStage[] = [
            {$match: query}, // Match by default query (e.g., deletedAt)
            // Lookups to populate related fields
            createLookupStage("autors", "autor", "autor"),
            createLookupStage("autors", "editor", "editor"),
            createLookupStage("autors", "ilustrator", "ilustrator"),
            createLookupStage("autors", "translator", "translator"),
            createLookupStage("users", "owner", "owner"),
            createLookupStage("users", "readBy", "readBy")
        ];

        const paginationPipeline = [
            ...pipeline,
            {$sort: sortOptions},
            {$skip: (parseInt(page as string) - 1) * parseInt(pageSize as string)},
            {$limit: parseInt(pageSize as string)},
        ]

        const books = await Book.aggregate(paginationPipeline).collation({ locale: "cs", strength: 2, numericOrdering: true });

        // Count total documents (for pagination)
        const count = (await Book.aggregate(pipeline)).length;

        // Send response
        res.status(200).json({books, count});
    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).json({message: "Internal server error"});
    }
};

const checkBooksUpdated = async (req: Request, res: Response): Promise<void> => {
    try {
        const { dataFrom } = req.query;

        // Find the most recently updated book
        const latestUpdate: {updatedAt: Date | undefined} = await Book.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean() as unknown as {updatedAt: Date | undefined};

        if (dataFrom && latestUpdate?.updatedAt && !isNaN(Number(dataFrom))) {
            const dataFromNumber = Number(dataFrom);
            const latestUpdateTime = latestUpdate?.updatedAt?.getTime();

            // Check if dataFrom is provided and if it's more recent than the latest update
            if (dataFromNumber >= latestUpdateTime) {
                // No new data, send 204 No Content and return
                res.status(204).end();
                return;
            }
        }

        // Data is not up-to-date, send 200 OK with the latest update timestamp
        res.status(200).json({ latestUpdate: latestUpdate?.updatedAt });
    } catch (error) {
        console.error("Error checking book updates:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getBooksByIds = async (req: Request, res: Response): Promise<void> => {
    try {
        const {ids} = req.query;
        const books = await Book.find({_id: {$in: ids}}).populate(populateOptionsBook);
        res.status(200).json({books});
    } catch (error) {
        console.error("Error fetching books:", error);
    }
}

const getBook = async (req: Request, res: Response): Promise<void> => {
    try {
        const book = await Book
            .findById(req.params.id)
            .populate(populateOptionsBook)
            .exec();
        res.status(200).json({book: book})
    } catch (err) {
        throw err;
    }
}

const addBook = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;

        const book: IBook = normalizeBook(data);
        book.wasChecked = true; //TEMP

        const bookToSave = new Book(book);

        const newBook: IBook = (await bookToSave.save()).toObject();

        const allBooks = await Book
            .find()
            .populate(populateOptionsBook)
            .exec();

        res.status(200).json({message: 'Book added', book: newBook, books: allBooks})
    } catch (error) {
        throw error
    }
}

const updateBook = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            params: {id},
            body,
        } = req;

        const book = normalizeBook(body);

        const updateBook = await Book.findByIdAndUpdate(
            {_id: id},
            book
        )

        const allBooks = await Book
            .find()
            .populate(populateOptionsBook)
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
        const deletedBook = await Book.findByIdAndUpdate(
            {_id: id},
            {
                ...body,
                deletedAt: new Date()
            }
        )
        const allBooks = await Book
            .find()
            .populate(populateOptionsBook)
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

        const bookInfo = await webScrapper(isbn);

        if (bookInfo) {
            res.status(200).json(bookInfo);
        } else {
            res.status(401).json({message: "Book not found"});
        }
    } catch (err) {
        throw "Problem at web scrapping: " + err;
    }
}

const dashboard = {
    getDimensionsStatistics: async (_: Request, res: Response): Promise<void> => {
        try {
            const result = await Book.aggregate([
                {
                    $match: {
                        deletedAt: undefined // Exclude documents that are deleted
                    }
                },
                {
                    $facet: {
                        stats: [
                            {
                                $group: {
                                    _id: null,
                                    sumHeight: {$sum: "$dimensions.height"},
                                    avgHeight: {$avg: "$dimensions.height"},
                                    minHeight: {$min: "$dimensions.height"},
                                    maxHeight: {$max: "$dimensions.height"},
                                    heights: {$push: "$dimensions.height"},
                                    sumWidth: {$sum: "$dimensions.width"},
                                    avgWidth: {$avg: "$dimensions.width"},
                                    minWidth: {$min: "$dimensions.width"},
                                    maxWidth: {$max: "$dimensions.width"},
                                    widths: {$push: "$dimensions.width"},
                                    sumDepth: {$sum: "$dimensions.depth"},
                                    avgDepth: {$avg: "$dimensions.depth"},
                                    minDepth: {$min: "$dimensions.depth"},
                                    maxDepth: {$max: "$dimensions.depth"},
                                    depths: {$push: "$dimensions.depth"},
                                    sumWeight: {$sum: "$dimensions.weight"},
                                    avgWeight: {$avg: "$dimensions.weight"},
                                    minWeight: {$min: "$dimensions.weight"},
                                    maxWeight: {$max: "$dimensions.weight"},
                                    weights: {$push: "$dimensions.weight"}
                                }
                            },
                            {
                                $project: {
                                    sumHeight: 1,
                                    avgHeight: 1,
                                    minHeight: 1,
                                    maxHeight: 1,
                                    medianHeight: {
                                        $let: {
                                            vars: {
                                                sortedArray: "$heights",
                                                len: {$size: "$heights"}
                                            },
                                            in: {
                                                $cond: [
                                                    {$eq: [{$mod: ["$$len", 2]}, 0]},
                                                    {
                                                        $avg: [
                                                            {$arrayElemAt: ["$$sortedArray", {$divide: ["$$len", 2]}]},
                                                            {$arrayElemAt: ["$$sortedArray", {$subtract: [{$divide: ["$$len", 2]}, 1]}]}
                                                        ]
                                                    },
                                                    {$arrayElemAt: ["$$sortedArray", {$floor: {$divide: ["$$len", 2]}}]}
                                                ]
                                            }
                                        }
                                    },
                                    sumWidth: 1,
                                    avgWidth: 1,
                                    minWidth: 1,
                                    maxWidth: 1,
                                    medianWidth: {
                                        $let: {
                                            vars: {
                                                sortedArray: "$widths",
                                                len: {$size: "$widths"}
                                            },
                                            in: {
                                                $cond: [
                                                    {$eq: [{$mod: ["$$len", 2]}, 0]},
                                                    {
                                                        $avg: [
                                                            {$arrayElemAt: ["$$sortedArray", {$divide: ["$$len", 2]}]},
                                                            {$arrayElemAt: ["$$sortedArray", {$subtract: [{$divide: ["$$len", 2]}, 1]}]}
                                                        ]
                                                    },
                                                    {$arrayElemAt: ["$$sortedArray", {$floor: {$divide: ["$$len", 2]}}]}
                                                ]
                                            }
                                        }
                                    },
                                    sumDepth: 1,
                                    avgDepth: 1,
                                    minDepth: 1,
                                    maxDepth: 1,
                                    medianDepth: {
                                        $let: {
                                            vars: {
                                                sortedArray: "$depths",
                                                len: {$size: "$depths"}
                                            },
                                            in: {
                                                $cond: [
                                                    {$eq: [{$mod: ["$$len", 2]}, 0]},
                                                    {
                                                        $avg: [
                                                            {$arrayElemAt: ["$$sortedArray", {$divide: ["$$len", 2]}]},
                                                            {$arrayElemAt: ["$$sortedArray", {$subtract: [{$divide: ["$$len", 2]}, 1]}]}
                                                        ]
                                                    },
                                                    {$arrayElemAt: ["$$sortedArray", {$floor: {$divide: ["$$len", 2]}}]}
                                                ]
                                            }
                                        }
                                    },
                                    sumWeight: 1,
                                    avgWeight: 1,
                                    minWeight: 1,
                                    maxWeight: 1,
                                    medianWeight: {
                                        $let: {
                                            vars: {
                                                sortedArray: "$weights",
                                                len: {$size: "$weights"}
                                            },
                                            in: {
                                                $cond: [
                                                    {$eq: [{$mod: ["$$len", 2]}, 0]},
                                                    {
                                                        $avg: [
                                                            {$arrayElemAt: ["$$sortedArray", {$divide: ["$$len", 2]}]},
                                                            {$arrayElemAt: ["$$sortedArray", {$subtract: [{$divide: ["$$len", 2]}, 1]}]}
                                                        ]
                                                    },
                                                    {$arrayElemAt: ["$$sortedArray", {$floor: {$divide: ["$$len", 2]}}]}
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        modeHeight: [
                            {$group: {_id: "$dimensions.height", modeHeight: {$sum: 1}}},
                            {$sort: {count: -1}},
                            {$limit: 1}
                        ],
                        modeWidth: [
                            {$group: {_id: "$dimensions.width", modeWidth: {$sum: 1}}},
                            {$sort: {count: -1}},
                            {$limit: 1}
                        ],
                        modeDepth: [
                            {$group: {_id: "$dimensions.depth", modeDepth: {$sum: 1}}},
                            {$sort: {count: -1}},
                            {$limit: 1}
                        ],
                        modeWeight: [
                            {$group: {_id: "$dimensions.weight", modeWeight: {$sum: 1}}},
                            {$sort: {count: -1}},
                            {$limit: 1}
                        ]
                    }
                },
                {
                    $project: {
                        sumHeight: "$stats.sumHeight",
                        avgHeight: "$stats.avgHeight",
                        minHeight: "$stats.minHeight",
                        maxHeight: "$stats.maxHeight",
                        medianHeight: "$stats.medianHeight",
                        modeHeight: "$modeHeight.modeHeight",
                        sumWidth: "$stats.sumWidth",
                        avgWidth: "$stats.avgWidth",
                        minWidth: "$stats.minWidth",
                        maxWidth: "$stats.maxWidth",
                        medianWidth: "$stats.medianWidth",
                        modeWidth: "$modeWidth.modeWidth",
                        sumDepth: "$stats.sumDepth",
                        avgDepth: "$stats.avgDepth",
                        minDepth: "$stats.minDepth",
                        maxDepth: "$stats.maxDepth",
                        medianDepth: "$stats.medianDepth",
                        modeDepth: "$modeDepth.modeDepth",
                        sumWeight: "$stats.sumWeight",
                        avgWeight: "$stats.avgWeight",
                        minWeight: "$stats.minWeight",
                        maxWeight: "$stats.maxWeight",
                        medianWeight: "$stats.medianWeight",
                        modeWeight: "$modeWeight.modeWeight"
                    }
                }
            ]);

            const formattedResult = {
                height: {
                    sum: result[0].sumHeight[0],
                    avg: result[0].avgHeight[0],
                    min: result[0].minHeight[0],
                    max: result[0].maxHeight[0],
                    mode: result[0].modeHeight[0],
                    median: result[0].medianHeight[0]
                },
                width: {
                    sum: result[0].sumWidth[0],
                    avg: result[0].avgWidth[0],
                    min: result[0].minWidth[0],
                    max: result[0].maxWidth[0],
                    mode: result[0].modeWidth[0],
                    median: result[0].medianWidth[0]
                },
                depth: {
                    sum: result[0].sumDepth[0],
                    avg: result[0].avgDepth[0],
                    min: result[0].minDepth[0],
                    max: result[0].maxDepth[0],
                    mode: result[0].modeDepth[0],
                    median: result[0].medianDepth[0]
                },
                weight: {
                    sum: result[0].sumWeight[0],
                    avg: result[0].avgWeight[0],
                    min: result[0].minWeight[0],
                    max: result[0].maxWeight[0],
                    mode: result[0].modeWeight[0],
                    median: result[0].medianWeight[0]
                }
            };

            /*result of this monstrosity looks like this:
            {"height":{"sum":10,"avg":10,"min":10,"max":10,"mode":16,"median":10},
            "width":{"sum":10,"avg":10,"min":10,"max":10,"mode":1,"median":10},
            "depth":{"sum":10,"avg":10,"min":10,"max":10,"mode":16,"median":10},
            "weight":{"sum":10,"avg":10,"min":10,"max":10,"mode":16,"median":10}}*/

            res.status(200).json(formattedResult);
        } catch (error: unknown) {
            console.log("Error while calculating statistics", error);
        }
    },
    getSizesGroups: async (_: Request, res: Response): Promise<void> => {
        try {
            const boundaries = [0, 5, 10, 15, 20, 25, 30, 35, 40, 100];

            // Single aggregation pipeline with $facet
            const aggregationPipeline = [
                {
                    $match: {
                        deletedAt: undefined // Exclude documents that are deleted
                    }
                },
                {
                    $facet: {
                        heightGroups: [
                            {
                                $bucket: {
                                    groupBy: "$dimensions.height",
                                    boundaries: boundaries,
                                    default: null,
                                    output: {
                                        count: {$sum: 1}
                                    }
                                }
                            }
                        ],
                        widthGroups: [
                            {
                                $bucket: {
                                    groupBy: "$dimensions.width",
                                    boundaries: boundaries,
                                    default: null,
                                    output: {
                                        count: {$sum: 1}
                                    }
                                }
                            }
                        ]
                    }
                }
            ];

            const results = await Book.aggregate(aggregationPipeline);

            // Extract height and width results
            const {heightGroups, widthGroups} = results[0];

            interface IDimensionGroup {
                _id: string | number; //10, 20 ... 40+
                count: number
            }

            // Total counts for normalization
            const totalHeightBooks = heightGroups.reduce((acc: number, current: IDimensionGroup) => acc + current.count, 0);
            const totalWidthBooks = widthGroups.reduce((acc: number, current: IDimensionGroup) => acc + current.count, 0);

            // Helper function to format the results
            const formatGroups = (groups: { _id: any; count: number }[], total: number) =>
                groups.map((group) => {
                    if (group._id) {
                        const lowerIndex = boundaries.indexOf(group._id);
                        const upperIndex = lowerIndex + 1;
                        return {
                            group: group._id >= 40 ? "40<" : `${boundaries[lowerIndex]}-${boundaries[upperIndex]}`,
                            count: group.count,
                            ratio: group.count / total,
                        };
                    } else {
                        return {
                            group: `Bez rozmerov`,
                            count: group.count,
                            ratio: group.count / total,
                        };
                    }
                });

            // Format both height and width groups
            const formattedHeight = formatGroups(heightGroups, totalHeightBooks);
            const formattedWidth = formatGroups(widthGroups, totalWidthBooks);

            res.status(200).json({
                height: formattedHeight,
                width: formattedWidth,
            });
        } catch (err) {
            console.error("Error while getSizesGroups", err);
            res.status(500).json({error: "Failed to get size groups."});
        }
    },
    getLanguageStatistics: async (_: Request, res: Response): Promise<void> => {
        const aggregationPipeline = [
            {
                $match: {
                    deletedAt: undefined // Exclude documents that are deleted
                }
            },
            {
                $addFields: {
                    firstLanguage: {$arrayElemAt: ["$language", 0]}
                }
            },
            {
                $group: {
                    _id: "$firstLanguage",
                    count: {$sum: 1}
                }
            },
            {
                $project: {
                    _id: 0,
                    language: "$_id",
                    count: 1
                }
            }
        ];

        let data = await Book.aggregate(aggregationPipeline);
        // replace null in object with "-"
        data.forEach(function (object) {
            for (let key in object) {
                if (object[key] == null || object[key] === "")
                    object[key] = "Bez jazyka";
            }
        });

        // merge count if key is same
        data = Object.values(
            data.reduce((acc: any, obj) => {
                if (!acc[obj.language]) {
                    acc[obj.language] = {...obj}; // Initialize with the first object
                } else {
                    acc[obj.language].count += obj.count; // Merge count values
                }
                return acc;
            }, {})
        );

        res.status(200).json(data);
    },
    countBooks: async (req: Request, res: Response): Promise<void> => {
        try {
            const {
                params: {userId}
            } = req

            let users = await User.find({});
            let response = [];

            if (userId) {
                const currUser = users.find(u => u._id === userId);

                response.push({
                    owner: {id: userId, firstName: currUser?.firstName ?? "", lastName: currUser?.lastName},
                    count: await Book.countDocuments({owner: userId, deletedAt: undefined})
                });
            } else {
                let tempRes: any[] = [];
                for (let user of users) {
                    //get stats for every of users
                    tempRes.push(
                        {
                            owner: {id: user._id, firstName: user?.firstName ?? "", lastName: user?.lastName},
                            count: await Book.countDocuments({owner: user._id, deletedAt: undefined})
                        }
                    )
                }

                // get stats for books without owner
                const query: mongoose.FilterQuery<IBook> = {
                    $or: [
                        {owner: {$exists: false}},
                        {owner: {$size: 0} as any}
                    ],
                    deletedAt: undefined
                }

                tempRes.push(
                    {
                        owner: {id: '', firstName: '', lastName: ''},
                        count: await Book.countDocuments(query)
                    }
                )

                response = tempRes;
            }

            response = response.map(dt => ({owner: dt.owner.firstName, count: dt.count}));
            const sortedData = sortByParam(response, "owner")
            sortedData.push({owner: null, count: await Book.countDocuments({deletedAt: undefined})});

            res.status(200).json(sortedData);
        } catch (error) {
            throw error;
        }
    },
    getReadBy: async (req: Request, res: Response): Promise<void> => {
        try {
            const users = (await User.find().select('_id firstName lastName')) as Partial<IUser>[];
            const totalBooksRead = await Book.countDocuments({deletedAt: {$ne: undefined}});

            const result: any[] = await Promise.all(
                users.map(async user => {
                    const userId = (user._id as string).toString();

                    const userStats: { name: string; stats: { user: string; count: number; ratio: number }[] } = {
                        name: user.firstName!,
                        stats: [],
                    };

                    for (const otherUser of users) {
                        const otherUserId = (otherUser._id as string).toString();

                        // Count books read by `user` that are owned by `otherUser`
                        const count = await Book.countDocuments({
                            owner: otherUserId,
                            readBy: {$in: [userId]},
                            deletedAt: undefined,
                        }) as number;

                        const ratio = totalBooksRead > 0 ? count / totalBooksRead : 0;

                        userStats.stats.push({
                            user: otherUser.firstName!,
                            count,
                            ratio: parseFloat(ratio.toFixed(2)),
                        });
                    }

                    return userStats;
                })
            );

            // Sort the result by array and then sort stats in every name
            const sortedData = sortByParam(result, 'name').map((item: any) => ({
                ...item,
                stats: sortByParam(item.stats, 'user'),
            }));

            res.status(200).json(sortedData);
        } catch (error) {
            console.error('Error calculating reading statistics:', error);
            res.status(500).json({message: 'Internal server error', error});
        }
    }

}

export {getAllBooks, addBook, updateBook, deleteBook, getBook, dashboard, getInfoFromISBN, getBooksByIds, checkBooksUpdated}