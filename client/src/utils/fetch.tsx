import {getAutors, getBoardGames, getBooks, getBooksByIds, getUsers} from "../API";
import {IAutor, IUser} from "../type";
import {formPersonsFullName} from "./utils";

const addColumnShowName = (items: any[]) => {
    return items?.map((item: any) => ({
        _id: item._id,
        showName: `${item.title} 
                        ${item.autor && item.autor[0] && item.autor[0].firstName ? "/ " + item.autor[0].firstName : ""} 
                        ${item.autor && item.autor[0] && item.autor[0].lastName ? item.autor[0].lastName : ""} 
                        ${item.published && item.published?.year ? "/ " + item.published?.year : ""}`
    }));
}

export const fetchAutors =
    async (query: string, page: number) => {
        const pageSize = 25;
        try {
            const response = await getAutors({search: query, page, pageSize});
            // Transform the data to match the expected format
            return response.data.autors.map((autor: IAutor) => ({
                _id: autor._id,
                fullName: autor.fullName, // Use fullName as displayValue
            }));
        } catch (error) {
            console.error('Error fetching autors:', error);
            return []; // Return an empty array on error
        }
    };

export const fetchUsers =
    async (_query: string) => {
        try {
            const response = await getUsers();

            return response.data.users.map((user: IUser) => ({
                _id: user._id,
                fullName: formPersonsFullName(user),
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    };

export const fetchBooks =
    async (query: string, page: number) => {
        const pageSize = 25;
        try {
            const response = await getBooks({search: query, page, pageSize});
            return addColumnShowName(response.data.books);
        } catch (error) {
            console.error('Error fetching books:', error);
            return [];
        }
    };

export const fetchQuotedBooks =
    async (query: string, page: number, ids?: string[]) => {
        const pageSize = 25;
        try {
            if (!ids || ids.length === 0) return [];
            const response = await getBooksByIds({search: query, page, pageSize, ids});
            return addColumnShowName(response.data.books);
        } catch (error) {
            console.error('Error fetching books:', error);
            return [];
        }
    };

export const fetchBoardGames =
    async (query: string, page: number) => {
        const pageSize = 25;
        try {
            const response = await getBoardGames({search: query, page, pageSize});
            return response.data.boardGames;
        } catch (error) {
            console.error('Error fetching books:', error);
            return [];
        }
    };