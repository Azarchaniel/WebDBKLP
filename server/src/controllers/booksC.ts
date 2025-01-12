import {Response, Request} from 'express';
import {IBook, IPopulateOptions} from '../types';
import Book from '../models/book';
import User from '../models/user';
import {optionFetchAllExceptDeleted} from '../utils/constants';
import {getIdFromArray, webScrapper} from "../utils/utils";
import mongoose from 'mongoose';

const populateOptions: IPopulateOptions[] = [
    {path: 'autor', model: 'Autor'},
    {path: 'editor', model: 'Autor'},
    {path: 'ilustrator', model: 'Autor'},
    {path: 'translator', model: 'Autor'},
    {path: 'owner', model: 'User'},
    {path: 'readBy', model: 'User'}
];

const normalizeBook = (data: any): IBook => {
    return {
        autor: getIdFromArray(data.autor),
        editor: getIdFromArray(data.editor),
        translator: getIdFromArray(data.translator),
        ilustrator: getIdFromArray(data.ilustrator),
        readBy: getIdFromArray(data.readBy),
        owner: getIdFromArray(data.owner),
        published: {
            publisher: data.published.publisher ?? "",
            year: data.published.year ?? undefined,
            country: data.published.country[0]?.key ?? ''
        },
        location: {
            city: data.location.city[0]?.value ?? '',
            shelf: data.location.shelf,
        },
        language: data.language?.map((lang: { key: string; value: string }) => lang.key),
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
            height: data.dimensions?.height,
            width: data.dimensions?.width,
            depth: data.dimensions?.depth,
            weight: data.dimensions?.weight
        },
        exLibris: data.exLibris,
        picture: data.picture,
        hrefGoodReads: data.hrefGoodReads,
        hrefDatabazeKnih: data.hrefDatabazeKnih,
    } as unknown as IBook
}

const getAllBooks = async (_: Request, res: Response): Promise<void> => {
    try {
        //remember: when populating, and NameOfField != Model, define it with {}
        const books = await Book
            .find(optionFetchAllExceptDeleted)
            .populate(populateOptions)
            .exec();
        const count = await Book.countDocuments(optionFetchAllExceptDeleted)
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
        const allBooks = await Book
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
        const data = req.body;

        const book: IBook = normalizeBook(data);

        const bookToSave = new Book(book);

        const newBook: IBook = await bookToSave.save()
        const allBooks = await Book
            .find()
            .populate(populateOptions)
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

        console.log(body);
        const book = normalizeBook(body);
        console.log(book);
        const updateBook = await Book.findByIdAndUpdate(
            {_id: id},
            book
        )
        const allBooks = await Book
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
        const deletedBook = await Book.findByIdAndUpdate(
            {_id: id},
            {
                ...body,
                deletedAt: new Date()
            }
        )
        const allBooks = await Book
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

        const bookInfo = await webScrapper(isbn);

        res.status(200).json(bookInfo);
    } catch (err) {
        throw "Problem at web scrapping: " + err;
    }
}

const dashboard = {
    getDimensionsStatistics: async (_: Request, res: Response): Promise<void> => {
        try {
            const result = [
                //$group: {_id: null -> group everything
                {
                    type: "sumHeight",
                    value: await Book.aggregate([
                        {$group: {_id: null, sumHeight: {$sum: "$dimensions.height"}}},
                    ])
                },
                {
                    type: "avgHeight",
                    value: await Book.aggregate([
                        {$group: {_id: null, avgHeight: {$avg: "$dimensions.height"}}},
                    ])
                },
                {
                    type: "minHeight",
                    value: await Book.aggregate([
                        {$group: {_id: null, minHeight: {$min: "$dimensions.height"}}},
                    ])
                },
                {
                    type: "maxHeight",
                    value: await Book.aggregate([
                        {$group: {_id: null, maxHeight: {$max: "$dimensions.height"}}},
                    ])
                },
                {
                    type: "modeHeight",
                    value: await Book.aggregate([
                        {$group: {_id: "$dimensions.height", modeHeight: {$sum: 1}}},
                        {$sort: {count: -1}},
                        {$limit: 1}
                    ])
                },
                {
                    type: "sumWidth",
                    value: await Book.aggregate([
                        {$group: {_id: null, sumWidth: {$sum: "$dimensions.width"}}},
                    ])
                },
                {
                    type: "avgWidth",
                    value: await Book.aggregate([
                        {$group: {_id: null, avgWidth: {$avg: "$dimensions.width"}}},
                    ])
                },
                {
                    type: "minWidth",
                    value: await Book.aggregate([
                        {$group: {_id: null, minWidth: {$min: "$dimensions.width"}}},
                    ])
                },
                {
                    type: "maxWidth",
                    value: await Book.aggregate([
                        {$group: {_id: null, maxWidth: {$max: "$dimensions.width"}}},
                    ])
                },
                {
                    type: "modeWidth",
                    value: await Book.aggregate([
                        {$group: {_id: "$dimensions.width", modeWidth: {$sum: 1}}},
                        {$sort: {count: -1}},
                        {$limit: 1}
                    ])
                },
                {
                    type: "sumDepth",
                    value: await Book.aggregate([
                        {$group: {_id: null, sumDepth: {$sum: "$dimensions.depth"}}},
                    ])
                },
                {
                    type: "avgDepth",
                    value: await Book.aggregate([
                        {$group: {_id: null, avgDepth: {$avg: "$dimensions.depth"}}},
                    ])
                },
                {
                    type: "minDepth",
                    value: await Book.aggregate([
                        {$group: {_id: null, minDepth: {$min: "$dimensions.depth"}}},
                    ])
                },
                {
                    type: "maxDepth",
                    value: await Book.aggregate([
                        {$group: {_id: null, maxDepth: {$max: "$dimensions.depth"}}},
                    ])
                },
                {
                    type: "modeDepth",
                    value: await Book.aggregate([
                        {$group: {_id: "$dimensions.depth", modeDepth: {$sum: 1}}},
                        {$sort: {count: -1}},
                        {$limit: 1}
                    ])
                },
                {
                    type: "sumWeight",
                    value: await Book.aggregate([
                        {$group: {_id: null, sumWeight: {$sum: "$dimensions.weight"}}},
                    ])
                },
                {
                    type: "avgWeight",
                    value: await Book.aggregate([
                        {$group: {_id: null, avgWeight: {$avg: "$dimensions.weight"}}},
                    ])
                },
                {
                    type: "minWeight",
                    value: await Book.aggregate([
                        {$group: {_id: null, minWeight: {$min: "$dimensions.weight"}}},
                    ])
                },
                {
                    type: "maxWeight",
                    value: await Book.aggregate([
                        {$group: {_id: null, maxWeight: {$max: "$dimensions.weight"}}},
                    ])
                },
                {
                    type: "modeWeight",
                    value: await Book.aggregate([
                        {$group: {_id: "$dimensions.weight", modeWeight: {$sum: 1}}},
                        {$sort: {count: -1}},
                        {$limit: 1}
                    ])
                },
                {
                    type: "medianHeight",
                    value: await Book.aggregate([
                        {$sort: {"dimensions.height": 1}}, // Sort by height in ascending order
                        {
                            $group: {
                                _id: null,
                                heights: {$push: "$dimensions.height"} // Collect all heights in an array
                            }
                        },
                        {
                            $project: {
                                medianHeight: {
                                    $let: {
                                        vars: {
                                            sortedArray: "$heights",
                                            len: {$size: "$heights"}
                                        },
                                        in: {
                                            $cond: [
                                                {$eq: [{$mod: ["$$len", 2]}, 0]}, // If even length
                                                {
                                                    $avg: [
                                                        {$arrayElemAt: ["$$sortedArray", {$divide: ["$$len", 2]}]},
                                                        {$arrayElemAt: ["$$sortedArray", {$subtract: [{$divide: ["$$len", 2]}, 1]}]}
                                                    ]
                                                },
                                                {$arrayElemAt: ["$$sortedArray", {$floor: {$divide: ["$$len", 2]}}]} // If odd length
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    ])
                },
                {
                    type: "medianWidth",
                    value: await Book.aggregate([
                        {$sort: {"dimensions.width": 1}},
                        {
                            $group: {
                                _id: null,
                                widths: {$push: "$dimensions.width"} // Fixed spelling from 'widthts' to 'widths'
                            }
                        },
                        {
                            $project: {
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
                                }
                            }
                        }
                    ])
                },
                {
                    type: "medianDepth",
                    value: await Book.aggregate([
                        {$sort: {"dimensions.depth": 1}}, // Sort by height in ascending order
                        {
                            $group: {
                                _id: null,
                                depths: {$push: "$dimensions.depth"} // Collect all heights in an array
                            }
                        },
                        {
                            $project: {
                                medianDepth: {
                                    $let: {
                                        vars: {
                                            sortedArray: "$depths",
                                            len: {$size: "$depths"}
                                        },
                                        in: {
                                            $cond: [
                                                {$eq: [{$mod: ["$$len", 2]}, 0]}, // If even length
                                                {
                                                    $avg: [
                                                        {$arrayElemAt: ["$$sortedArray", {$divide: ["$$len", 2]}]},
                                                        {$arrayElemAt: ["$$sortedArray", {$subtract: [{$divide: ["$$len", 2]}, 1]}]}
                                                    ]
                                                },
                                                {$arrayElemAt: ["$$sortedArray", {$floor: {$divide: ["$$len", 2]}}]} // If odd length
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    ])
                },
                {
                    type: "medianWeight",
                    value: await Book.aggregate([
                        {$sort: {"dimensions.weight": 1}}, // Sort by height in ascending order
                        {
                            $group: {
                                _id: null,
                                weights: {$push: "$dimensions.weight"} // Collect all heights in an array
                            }
                        },
                        {
                            $project: {
                                medianWeight: {
                                    $let: {
                                        vars: {
                                            sortedArray: "$weights",
                                            len: {$size: "$weights"}
                                        },
                                        in: {
                                            $cond: [
                                                {$eq: [{$mod: ["$$len", 2]}, 0]}, // If even length
                                                {
                                                    $avg: [
                                                        {$arrayElemAt: ["$$sortedArray", {$divide: ["$$len", 2]}]},
                                                        {$arrayElemAt: ["$$sortedArray", {$subtract: [{$divide: ["$$len", 2]}, 1]}]}
                                                    ]
                                                },
                                                {$arrayElemAt: ["$$sortedArray", {$floor: {$divide: ["$$len", 2]}}]} // If odd length
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    ])
                }
            ]
                .map(result => {
                    return {type: result.type, value: result.value[0][result.type]}
                })
                .reduce((acc: any, {type, value}) => {
                    const [metric, dimension] = type.match(/([a-zA-Z]+)([A-Z].+)/)!.slice(1);
                    const dimensionLower: string = dimension.toLowerCase();

                    if (!acc[dimensionLower]) {
                        acc[dimensionLower] = {};
                    }

                    acc[dimensionLower][metric] = value;
                    return acc;
                }, {});


            //result of this monstrosity looks like this:
            // {"height":{"sum":10,"avg":10,"min":10,"max":10,"mode":16,"median":10},
            // "width":{"sum":10,"avg":10,"min":10,"max":10,"mode":1,"median":10},
            // "depth":{"sum":10,"avg":10,"min":10,"max":10,"mode":16,"median":10},
            // "weight":{"sum":10,"avg":10,"min":10,"max":10,"mode":16,"median":10}}

            res.status(200).json(result);
        } catch (error: unknown) {
            console.log("Error while calculating statistics", error);
        }
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
                    count: await Book.countDocuments({owner: userId})
                });
            } else {
                let tempRes: any[] = [];
                for (let user of users) {
                    tempRes.push(
                        {
                            owner: {id: user?._id, firstName: user?.firstName ?? "", lastName: user?.lastName},
                            count: await Book.countDocuments({owner: user?._id})
                        }
                    )
                }

                const query: mongoose.FilterQuery<IBook> = {
                    $or: [
                        {owner: {$exists: false}},
                        {owner: {$size: 0} as any}
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
            response.sort((a, b) => {
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
