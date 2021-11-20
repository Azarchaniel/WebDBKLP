import {Response, Request} from 'express';
import {ILp} from '../types';
import Lp from '../models/lp';

const getAllLps = async (req: Request, res: Response): Promise<void> => {
    try {
        const lps: ILp[] = await Lp
            .find()
            .populate([
                {path: 'autor', model: 'Autor'},
            ])
            .exec();
        res.status(200).json({lps: lps})
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
        //todo: there has to be a better way for cleaner code
        const {
            title, subtitle, edition, countLp, speed, published, language, note, autor
        } = req.body;
        console.trace(req.body);

        const lp: ILp = new Lp({
            autor: autor,
            title: title,
            subtitle: subtitle,
            edition: edition,
            language: language,
            note: note,
            countLp: countLp,
            published: {
                publisher: published?.publisher,
                year: published?.year ?? undefined,
                country: published?.country ?? ''
            },
            speed: speed
        })

        const newLp: ILp = await lp.save()
        const allLps: ILp[] = await Lp.find().populate([
            {path: 'autor', model: 'Autor'},
        ]).exec()

        res.status(201).json({message: 'Lp added', lp: newLp, lps: allLps})
    } catch (error) {
        throw error
    }
}

const updateLp = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            params: {id},
            body,
        } = req
        const updateLp: ILp | null = await Lp.findByIdAndUpdate(
            {_id: id},
            body
        )
        const allLps: ILp[] = await Lp.find().populate([
            {path: 'autor', model: 'Autor'},
        ]).exec()

        res.status(200).json({
            message: 'Lp updated',
            lp: updateLp,
            lps: allLps,
        })
    } catch (error) {
        throw error
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
                isDeleted: true
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
export {getAllLps, addLp, updateLp, deleteLp, getLp}
