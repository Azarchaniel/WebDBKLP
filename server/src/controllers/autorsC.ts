import {Response, Request} from 'express';
import {IAutor} from '../types';
import Autor from "../models/autor";
import Book from "../models/book";
import {Types} from "mongoose";
import {fetchDataWithPagination} from "../utils/queryUtils";
import Lp from "../models/lp";

const getAllAutors = async (req: Request, res: Response): Promise<void> => {
    try {
        const {page = "1", pageSize = "10_000", search = "", sorting, dataFrom} = req.query;

        const searchFields = ["firstName", "lastName"];
        const parsedPage = parseInt(page as string, 10);
        const parsedPageSize = parseInt(pageSize as string, 10);

        const {data, count, latestUpdate} = await fetchDataWithPagination(
            Autor,
            {
                page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
                pageSize: isNaN(parsedPageSize) || parsedPageSize < 1 ? 10_000 : parsedPageSize,
                search: search as string,
                sorting: sorting as string,
                dataFrom: dataFrom as string,
                searchFields
            },
            []
        );

        res.status(200).json({autors: data, count: count, latestUpdate: latestUpdate})
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
        res.status(500).json({error: "Internal server error"});
    }
}

const getAllAutorsBooks = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params; // autor ID

        if (!id) {
            res.status(204).send();
            return;
        }

        const searchId = new Types.ObjectId(id);

        const booksPromises: Promise<any>[] = [];
        const lpsPromises: Promise<any>[] = [];

        booksPromises.push(
            Book.find({
                $or: [
                    {autor: searchId},
                    {translator: searchId},
                    {editor: searchId},
                    {ilustrator: searchId}
                ],
                deletedAt: null
            }).sort({title: 1})
        );

        lpsPromises.push(
            Lp.find({autor: searchId, deletedAt: null}).sort({title: 1})
        );

        const [books, lps] = await Promise.all([
            Promise.all(booksPromises).then(results => results.flat()),
            Promise.all(lpsPromises).then(results => results.flat())
        ]);

        res.status(200).json({books, lps});
    } catch (error) {
        console.error("Error fetching books/LPs:", error);
        res.status(500).json({error: "Internal server error"});
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
            role: role?.map((val: { value: string, showValue: string }) => val.value),
            deletedAt: null
        });

        const newAutor: IAutor = await autor.save()

        res.status(201).json({message: 'Autor added', autor: newAutor})
    } catch (error) {
        console.error("Error adding autor:", error);
        res.status(500).json({error: "Internal server error"});
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
                role: body.role?.map((val: { value: string, showValue: string }) => val.value),
            }
        )

        res.status(201).json({
            message: 'Autor updated',
            autor: updateAutor
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

        res.status(200).json({
            message: 'Autor deleted',
            autor: deletedAutor,
        })
    } catch (error) {
        console.error("Error deleting autor:", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export {getAllAutors, addAutor, updateAutor, deleteAutor, getAutor, getAllAutorsBooks};
