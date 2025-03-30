import {getAutors, getBooks, getBooksByIds, getUsers} from "../API";
import {IAutor, IUser} from "../type";
import {formPersonsFullName} from "./utils";

const addColumnShowName = (books: any[]) => {
    return books.map((book: any) => ({
        _id: book._id,
        showName: `${book.title} 
                        ${book.autor && book.autor[0] && book.autor[0].firstName ? "/ " + book.autor[0].firstName : ""} 
                        ${book.autor && book.autor[0] && book.autor[0].lastName ? book.autor[0].lastName : ""} 
                        ${book.published && book.published?.year ? "/ " + book.published?.year : ""}`
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
    async (_query: string, page: number) => {
        try {
            if (page > 1) return [];
            const response = await getUsers();
            const users = response.data.users.map((user: IUser) => ({
                _id: user._id,
                fullName: formPersonsFullName(user),
            }));
            return users;
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