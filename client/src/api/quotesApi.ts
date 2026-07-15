import { ApiQuoteDataType, IQuoteModalInput } from "../type";
import { axiosInstance, baseUrl, BATCH_SIZE } from "./http";
import { ApiResponse, SavePayload } from "./types";

export const getQuotes = async (filterByBook?: string[], activeUsers?: string[], page?: number, limit?: number, search?: string): Promise<ApiResponse<ApiQuoteDataType>> => {
    try {
        return await axiosInstance.get(
            baseUrl + "/quotes", {
            params: {
                activeUsers,
                filterByBook,
                page,
                limit,
                search,
            }
        }
        );
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getQuote = async (_id: string): Promise<ApiResponse<ApiQuoteDataType>> => {
    try {
        return await axiosInstance.get(`${baseUrl}/quote/${_id}`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const addQuote = async (formData: SavePayload<IQuoteModalInput>): Promise<ApiResponse<ApiQuoteDataType> | any> => {
    try {
        if (Array.isArray(formData)) {
            const results = [];
            for (let i = 0; i < formData.length; i += BATCH_SIZE) {
                const batch = formData.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(async (quoteData) => {
                    const quote = {
                        id: quoteData._id,
                        text: quoteData.text,
                        fromBook: quoteData.fromBook,
                        pageNo: quoteData.pageNo ?? null,
                        owner: quoteData.owner ?? [],
                        note: quoteData.note
                    };

                    if (!quote.id) {
                        return await axiosInstance.post(baseUrl + "/add-quote", quote);
                    }
                    return await axiosInstance.put(`${baseUrl}/edit-quote/${quote.id}`, quote);
                });
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }
            return results;
        }

        const quote = {
            id: formData._id,
            text: formData.text,
            fromBook: formData.fromBook,
            pageNo: formData.pageNo ?? null,
            owner: formData.owner ?? [],
            note: formData.note
        };

        if (!quote.id) {
            return await axiosInstance.post(baseUrl + "/add-quote", quote);
        }
        return await axiosInstance.put(`${baseUrl}/edit-quote/${quote.id}`, quote);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const deleteQuote = async (_id: string): Promise<ApiResponse<ApiQuoteDataType>> => {
    try {
        return await axiosInstance.post(`${baseUrl}/delete-quote/${_id}`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getAllQuotesForCache = async (dataFrom?: string | null): Promise<ApiResponse<ApiQuoteDataType>> => {
    try {
        return await axiosInstance.get(baseUrl + "/quotes", {
            params: {
                page: 1,
                limit: 10000,
                syncMode: true,
                dataFrom: dataFrom ?? undefined,
            }
        });
    } catch (error: any) {
        throw new Error(error);
    }
};