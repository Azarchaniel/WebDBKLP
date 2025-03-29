import {getAutors, getUsers} from "../API";
import {IAutor, IUser} from "../type";
import {formPersonsFullName} from "./utils";

export const fetchAutors =
    async (query: string, page: number) => {
        const pageSize = 10;
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