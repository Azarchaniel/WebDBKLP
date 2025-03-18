import {Response, Request} from 'express';
import {IAutor} from '../types';
import Autor from "../models/autor";
import Book from "../models/book";
import diacritics from "diacritics";
import {PipelineStage, Types} from "mongoose";

const getAllAutors = async (req: Request, res: Response): Promise<void> => {
    try {
        let {page, pageSize, search = "", sorting, dataFrom} = req.query;

        const latestUpdate: {updatedAt: Date | undefined} = await Autor.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean() as unknown as {updatedAt: Date | undefined};

        // Check if dataFrom is provided and if it's more recent than the latest update
        if (dataFrom && latestUpdate?.updatedAt && new Date(dataFrom as string) >= new Date(latestUpdate.updatedAt)) {
            // No new data, send 204 No Content and return
            res.status(204).send();
            return;
        }

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
            sortOptions["lastName"] = 1;
        }

        let query: Record<string, any> = {deletedAt: {$eq: null}};

        const normalizedSearchFields = [
            "firstName", "lastName"
        ];

        // Add search conditions to the query if a search term is provided
        if (search) {
            query = {
                ...query,
                $or: normalizedSearchFields.map(field => ({
                    [`normalizedSearchField.${field}`]: {$regex: diacritics.remove(search as string), $options: "i"}
                }))
            };
        }

        const pipeline: PipelineStage[] = [
            {$match: query}
        ];

        const paginationPipeline = [
            ...pipeline,
            {$match: query}, // Match by default query (e.g., deletedAt)
            {$sort: sortOptions},
            {$skip: (parseInt(page as string) - 1) * parseInt(pageSize as string)},
            {$limit: parseInt(pageSize as string)},
        ];

        const autors = await Autor.aggregate(paginationPipeline);
        const count: number = (await Autor.aggregate(pipeline)).length;

        res.status(200).json({autors: autors, count: count, latestUpdate: latestUpdate?.updatedAt})
    } catch (error) {
        console.error("Error fetching autors:", error);
        res.status(500).json({message: "Internal server error"});
    }
}

const getAutor = async (req: Request, res: Response): Promise<void> => {
    try {
        const autor: IAutor | null = await Autor.findById(req.params.id);
        res.status(200).json({autor: autor})
    } catch (err) {
        console.error("Can't find autor", err);
        res.status(500).json({ error: "Internal server error" });
    }
}

const getAllAutorsBooks = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params; //autor ID

        if (!id) {
            res.status(204).send();
            return;
        }

        const searchId = new Types.ObjectId(id);

        const books = await Book.find({
            $or: [
                { autor: searchId },
                { translator: searchId },
                { editor: searchId },
                { ilustrator: searchId }
            ]
        });

        res.status(200).json({books});
    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const addAutor = async (req: Request, res: Response): Promise<void> => {
    const {firstName, lastName, dateOfBirth, dateOfDeath, note, nationality, role} = req.body;

    try {
        const autor: IAutor = new Autor({
            firstName: firstName,
            lastName: lastName,
            dateOfBirth: dateOfBirth,
            dateOfDeath: dateOfDeath,
            note: note,
            nationality: nationality?.[0]?.key ?? '',
            role: role?.map((val: {value: string, showValue: string}) => val.value),
            deletedAt: null
        });

        const newAutor: IAutor = await autor.save()
        const allAutors: IAutor[] = await Autor.find()

        res.status(201).json({message: 'Autor added', autor: newAutor, autors: allAutors})
    } catch (error) {
        console.error("Error adding autor:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const updateAutor = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            params: {id},
            body,
        } = req

        const nationalityValue = body.nationality ?
            Array.isArray(body.nationality) ? body.nationality[0]?.key : body.nationality
            : null;

        const updateAutor: IAutor | null = await Autor.findByIdAndUpdate(
            {_id: id},
            {
                ...body,
                nationality: nationalityValue,
                role: body.role?.map((val: {value: string, showValue: string}) => val.value),
            }
        )
        const allAutors: IAutor[] = await Autor.find()
        res.status(201).json({
            message: 'Autor updated',
            autor: updateAutor,
            autors: allAutors,
        })
    } catch (error) {
        console.error("Error updating autor:", error);
        res.status(500).json({error: "Internal server error"});
    }
}

const deleteAutor = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            params: {id},
            body,
        } = req
        const deletedAutor: IAutor | null = await Autor.findByIdAndUpdate(
            {_id: id},
            {
                ...body,
                deletedAt: new Date()
            }
        )
        const allAutors: IAutor[] = await Autor.find()
        res.status(200).json({
            message: 'Autor deleted',
            autor: deletedAutor,
            autors: allAutors,
        })
    } catch (error) {
        console.error("Error deleting autor:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export {getAllAutors, addAutor, updateAutor, deleteAutor, getAutor, getAllAutorsBooks};
