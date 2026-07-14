import { ApiBookDataType, IBook } from "../type";
import { axiosInstance, baseUrl, BATCH_SIZE } from "./http";
import { ApiResponse, IdPaginationRequest, LatestUpdateResponse, PageByLetterResponse, PaginationRequest, SavePayload, UniqueFieldValuesResponse } from "./types";

export const getPageByStartingLetter = async (letter: string, pageSize: number, model: string, filterUsers?: string[]): Promise<ApiResponse<PageByLetterResponse>> => {
    try {
        return await axiosInstance.get(
            baseUrl + "/get-page-by-starting-letter", {
            params: {
                letter,
                pageSize,
                model,
                filterUsers
            }
        }
        );
    } catch (error: any) {
        console.error("Cannot get page by starting letter: ", error);
        throw new Error(error);
    }
};

export const getBooks = async (params?: PaginationRequest): Promise<ApiResponse<ApiBookDataType>> => {
    try {
        return await axiosInstance.get(
            baseUrl + "/books", {
            params: {
                page: params?.page ?? 1,
                pageSize: params?.pageSize ?? 100,
                search: params?.search ?? "",
                sorting: params?.sorting ?? [{ id: "title", desc: false }],
                filterUsers: params?.activeUsers,
                filters: params?.filters ?? []
            },
            signal: params?.signal
        });
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getBooksByIds = async (params?: IdPaginationRequest): Promise<ApiResponse<ApiBookDataType>> => {
    try {
        return await axiosInstance.get(
            baseUrl + "/books-by-ids", {
            params: {
                page: params?.page ?? 1,
                pageSize: params?.pageSize ?? 100,
                search: params?.search ?? "",
                sorting: params?.sorting ?? [{ id: "title", desc: false }],
                ids: params?.ids ?? [],
            }
        });
    } catch (error: any) {
        console.error("Cannot get books by ids: ", error);
        throw new Error(error);
    }
};

export const checkBooksUpdated = async (dataFrom?: Date | number): Promise<ApiResponse<LatestUpdateResponse>> => {
    try {
        return await axiosInstance.get(
            baseUrl + "/books/check-updated", {
            params: {
                dataFrom
            }
        }
        );
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getBook = async (_id: string): Promise<ApiResponse<ApiBookDataType>> => {
    try {
        return await axiosInstance.get(`${baseUrl}/book/${_id}`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const addBook = async (formData: SavePayload<IBook>): Promise<any> => {
    try {
        if (
            (!Array.isArray(formData) && !("id" in formData)) ||
            (Array.isArray(formData) && !formData[0]?._id)
        ) {
            return await axiosInstance.post(baseUrl + "/add-book", formData);
        }

        if (Array.isArray(formData)) {
            const results = [];
            for (let i = 0; i < formData.length; i += BATCH_SIZE) {
                const batch = formData.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(async (book: IBook) =>
                    await axiosInstance.put(`${baseUrl}/edit-book/${book._id}`, book)
                );
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }
            return results;
        }

        return await axiosInstance.put(
            `${baseUrl}/edit-book/${(formData as unknown as IBook)["_id"]}`,
            formData
        );
    } catch (error: any) {
        throw new Error(error);
    }
};

export const deleteBook = async (_id: string): Promise<ApiResponse<ApiBookDataType>> => {
    try {
        return await axiosInstance.delete(`${baseUrl}/book/${_id}`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getInfoAboutBook = async (isbn: string): Promise<any> => {
    return await axiosInstance.get(`${baseUrl}/get-book-info/${isbn}`);
};

export const getUniqueFieldValues = async (): Promise<ApiResponse<UniqueFieldValuesResponse>> => {
    try {
        return await axiosInstance.get(`${baseUrl}/books/get-unique-field-values`);
    } catch (error: any) {
        throw new Error(error);
    }
};