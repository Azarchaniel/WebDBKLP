import BoardGame from "../models/boardGame";
import {Response, Request} from 'express';
import {fetchDataWithPagination} from "../utils/queryUtils";
import {createLookupStage, getIdFromArray} from "../utils/utils";
import {IBoardGame} from "../types";

const getAllBoardGames = async (req: Request, res: Response): Promise<void> => {
    try {
        const {page = "1", pageSize = "10_000", search = "", sorting, dataFrom} = req.query;

        const searchFields = ["title", "autor", "published.publisher"];
        const parsedPage = parseInt(page as string, 10);
        const parsedPageSize = parseInt(pageSize as string, 10);

        const lookupStages = [
            createLookupStage("autors", "autor", "autor")
        ];

        const {data, count, latestUpdate} = await fetchDataWithPagination(
            BoardGame,
            {
                page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
                pageSize: isNaN(parsedPageSize) || parsedPageSize < 1 ? 10_000 : parsedPageSize,
                search: search as string,
                sorting: sorting as string,
                dataFrom: dataFrom as string,
                searchFields
            },
            lookupStages
        );

        res.status(200).json({boardGames: data, count: count, latestUpdate: latestUpdate})
    } catch (error) {
        console.error("Error fetching board games:", error);
        res.status(500).json({error: "Internal server error"});
    }
}

const getBoardGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params
        const boardGame = await BoardGame.findById(id).populate('autor')
        if (!boardGame) {
            res.status(404).json({error: "Board game not found"})
            return
        }
        res.status(200).json(boardGame)
    } catch (error) {
        console.error("Error fetching board game:", error);
        res.status(500).json({error: "Internal server error"});
    }
}

const addBoardGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            title,
            picture,
            url,
            noPlayers,
            playTime,
            ageRecommendation,
            published,
            autor,
            note
        } = req.body

        const countryPublished = published ?
            Array.isArray(published?.country) ? published?.country?.[0]?.key : published?.country
            : null;

        const boardGame = {
            title,
            picture,
            url,
            noPlayers,
            playTime,
            ageRecommendation,
            published: {...published, country: countryPublished},
            note,
            autor: getIdFromArray(autor)
        };

        const bgToSave = new BoardGame(boardGame);
        const newBoardGame: IBoardGame = (await bgToSave.save()).toObject();

        res.status(201).json(newBoardGame)
    } catch (error) {
        console.error("Error creating board game:", error);
        res.status(500).json({error: "Internal server error"});
    }
}

const updateBoardGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params
        const {
            title,
            description,
            image,
            noPlayers,
            playTime,
            ageRecommendation,
            published,
            autor
        } = req.body

        const countryPublished = published ?
            Array.isArray(published?.country) ? published?.country?.[0]?.key : published?.country
            : null;

        const updatedBoardGame = await BoardGame.findByIdAndUpdate(id, {
            title,
            description,
            image,
            noPlayers,
            playTime,
            ageRecommendation,
            published: {...published, country: countryPublished},
            autor: getIdFromArray(autor)
        }, {new: true})
        if (!updatedBoardGame) {
            res.status(404).json({error: "Board game not found"})
            return
        }
        res.status(200).json(updatedBoardGame)
    } catch (error) {
        console.error("Error updating board game:", error);
        res.status(500).json({error: "Internal server error"});
    }
}

const deleteBoardGame = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id} = req.params
        const deletedBoardGame = await BoardGame.findByIdAndUpdate(id, {deletedAt: new Date()})
        if (!deletedBoardGame) {
            res.status(404).json({error: "Board game not found"})
            return
        }
        res.status(200).json(deletedBoardGame)
    } catch (error) {
        console.error("Error deleting board game:", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export {getAllBoardGames, getBoardGame, addBoardGame, updateBoardGame, deleteBoardGame};