import {Response, Request} from 'express';
import {ILp} from '../types';
import Lp from '../models/lp';
import {optionFetchAllExceptDeleted} from '../utils/constants';
import {createLookupStage} from "../utils/utils";
import {fetchDataWithPagination} from "../utils/queryUtils";

const getAllLps = async (req: Request, res: Response): Promise<void> => {
    try {
        const {page = "1", pageSize = "10_000", search = "", sorting} = req.query;

        const searchFields = [
            "title",
            "subtitle",
            "note",
            "published"
        ];

        const lookupStages = [
            createLookupStage("autors", "autor", "autor")
        ];

        const parsedPage = parseInt(page as string, 10);
        const parsedPageSize = parseInt(pageSize as string, 10);

        const {data, count} = await fetchDataWithPagination(
            Lp,
            {
                page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
                pageSize: isNaN(parsedPageSize) || parsedPageSize < 1 ? 10_000 : parsedPageSize,
                search: search as string,
                sorting: sorting as string,
                searchFields
            },
            lookupStages
        );

        res.status(200).json({lps: data, count: count})
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
        const publishedCountryNormalized = Array.isArray(published.country) ? published.country?.[0] : published.country;

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
                    country: publishedCountryNormalized ?? ''
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
                    language: languageNormalized,
                    published: {...published, country: publishedCountryNormalized}
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
