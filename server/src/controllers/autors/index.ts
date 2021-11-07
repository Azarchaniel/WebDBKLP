import {Response, Request} from 'express';
import {IAutor} from '../../types';
import Autor from "../../models/autor";

const getAllAutors = async (req: Request, res: Response): Promise<void> => {
    try {
        const autors: IAutor[] = await Autor.find()

        res.status(200).json({autors: autors})
    } catch (error) {
        throw error
    }
}

const getAutor = async (req: Request, res: Response): Promise<void> => {
    try {
        const autor = await Autor.findById(req.params.id);
        const allAutors: IAutor[] = await Autor.find()
        res.status(200).json({autor: autor, autors: allAutors})
    } catch (err) {
        throw err;
    }
}

const addAutor = async (req: any, res: any): Promise<void> => {
    try {
        //todo: maybe just const {firstName} = body; ?? Or not at all?
        const body = req.body as Pick<IAutor, 'firstName' | 'lastName' | 'dateOfBirth' | 'dateOfDeath' | 'note' | 'nationality'>

        const autor: IAutor = new Autor({
            firstName: body.firstName,
            lastName: body.lastName,
            dateOfBirth: body.dateOfBirth,
            dateOfDeath: body.dateOfDeath,
            note: body.note,
            nationality: body.nationality
        });

        const newAutor: IAutor = await autor.save()
        const allAutors: IAutor[] = await Autor.find()

        res.status(201).json({message: 'Autor added', autor: newAutor, autors: allAutors})
    } catch (error) {
        throw error
    }
}

const updateAutor = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            params: {id},
            body,
        } = req
        const updateAutor: IAutor | null = await Autor.findByIdAndUpdate(
            {_id: id},
            body
        )
        const allAutors: IAutor[] = await Autor.find()
        res.status(200).json({
            message: 'Autor updated',
            Autor: updateAutor,
            Autors: allAutors,
        })
    } catch (error) {
        throw error
    }
}

const deleteAutor = async (req: Request, res: Response): Promise<void> => {
    try {
        console.trace(req.params);
        const deletedAutor: IAutor | null = await Autor.findByIdAndRemove(
            req.params.id
        )
        const allAutors: IAutor[] = await Autor.find()
        res.status(200).json({
            message: 'Autor deleted',
            autor: deletedAutor,
            autors: allAutors,
        })
    } catch (error) {
        throw error
    }
}

export {getAllAutors, addAutor, updateAutor, deleteAutor, getAutor};
