import {Response, Request} from 'express';
import {ILp} from '../types';
import Lp from '../models/lp';
import {optionFetchAllExceptDeleted} from '../utils/constants';
import diacritics from "diacritics";
import {PipelineStage} from "mongoose";
import {createLookupStage} from "../utils/utils";

const getAllLps = async (req: Request, res: Response): Promise<void> => {
    try {
        let {page, pageSize, search = "", sorting} = req.query;

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
            "title",
            "subtitle",
            "note",
            "published"
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
            {$match: query},
        ];

        const paginationPipeline = [
            ...pipeline,
            createLookupStage("autors", "autor", "autor"),
            {$sort: sortOptions},
            {$skip: (parseInt(page as string) - 1) * parseInt(pageSize as string)},
            {$limit: parseInt(pageSize as string)},
        ];

        const lps: ILp[] = await Lp.aggregate(paginationPipeline);
        const count: number = (await Lp.aggregate(pipeline)).length;

        res.status(200).json({lps: lps, count: count})
    } catch (error) {
        throw error
    }
}

const getLp = async (req: Request, res: Response): Promise<void> => {
    try {
        const lp = await Lp
            .findById(req.params.id)
            .populate([
                {path: 'autor', model: 'Autor'},
            ])
            .exec();
        const allLps: ILp[] = await Lp.find().populate([
            {path: 'autor', model: 'Autor'},
        ]).exec()
        res.status(200).json({lp: lp, lps: allLps})
    } catch (err) {
        throw err;
    }
}

const addLp = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            _id, title, subtitle, edition, countLp, speed, published, language, note, autor
        } = req.body;

        const languageNormalized = language?.map((lang: { key: string; value: string }) => lang.key);

        if (!_id) {
            const lp: ILp = new Lp({
                autor: autor,
                title: title,
                subtitle: subtitle,
                edition: edition,
                language: languageNormalized,
                note: note,
                countLp: countLp,
                published: {
                    publisher: published?.publisher,
                    year: published?.year ?? undefined,
                    country: published?.country ?? ''
                },
                speed: speed,
                deletedAt: null
            })

            const newLp: ILp = await lp.save()
            const allLps: ILp[] = await Lp.find(optionFetchAllExceptDeleted).populate([
                {path: 'autor', model: 'Autor'},
            ]).exec()

            res.status(201).json({message: 'Lp added', lp: newLp, lps: allLps})
        } else {
            const updateLp: ILp | null = await Lp.findByIdAndUpdate(
                {_id: _id},
                {
                    ...req.body,
                    language: languageNormalized
                }
            )
            const allLps: ILp[] = await Lp.find().populate([
                {path: 'autor', model: 'Autor'},
            ]).exec()

            res.status(201).json({
                message: 'Lp updated',
                lp: updateLp,
                lps: allLps,
            })
        }
    } catch (error) {
        throw Error("Error while creating/editing LP \n" + error)
    }
}


const deleteLp = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            params: {id},
            body,
        } = req
        const deletedLp: ILp | null = await Lp.findByIdAndUpdate(
            {_id: id},
            {
                ...body,
                deletedAt: new Date()
            }
        )
        const allLps: ILp[] = await Lp.find().populate([
            {path: 'autor', model: 'Autor'},
        ]).exec()

        res.status(200).json({
            message: 'Lp deleted',
            lp: deletedLp,
            lps: allLps,
        })
    } catch (error) {
        throw error
    }
}
export {getAllLps, addLp, deleteLp, getLp}
