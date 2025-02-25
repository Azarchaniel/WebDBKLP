import {Response, Request} from 'express';
import {IAutor} from '../types';
import Autor from "../models/autor";
import {optionFetchAllExceptDeleted} from '../utils/constants';
import Book from "../models/book";

const getAllAutors = async (req: Request, res: Response): Promise<void> => {
    try {
        const autors: IAutor[] = await Autor.find(optionFetchAllExceptDeleted)
        const count: number = await Autor.countDocuments(optionFetchAllExceptDeleted)

        res.status(200).json({autors: autors, count: count})
    } catch (error) {
        res.status(500);
        throw error
    }
}

const getAutor = async (req: Request, res: Response): Promise<void> => {
    try {
        const autor: IAutor | null = await Autor.findById(req.params.id);
        const allAutors: IAutor[] = await Autor.find()
        res.status(200).json({autor: autor, autors: allAutors})
    } catch (err) {
        console.error("Can't find autor", err);
    }
}

const getAllAutorsBooks = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params; //autor ID

        const books = await Book.find({
            $or: [
                { autor: id },
                { translator: id },
                { editor: id },
                { ilustrator: id }
            ]
        });

        res.status(200).json({books});
    } catch (error) {
        console.error("Error fetching books:", error);
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
        throw error
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
        throw error
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
        throw error
    }
}

export {getAllAutors, addAutor, updateAutor, deleteAutor, getAutor, getAllAutorsBooks};
