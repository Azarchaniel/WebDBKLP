import { ApiBoardGameDataType, ApiBookDataType } from "../type";
import { axiosInstance, baseUrl, BATCH_SIZE } from "./http";
import { ApiResponse, PaginationRequest } from "./types";

export const getBoardGames = async (params?: PaginationRequest): Promise<ApiResponse<ApiBoardGameDataType>> => {
    try {
        return await axiosInstance.get(
            baseUrl + "/boardgames", {
            params: {
                page: params?.page ?? 1,
                pageSize: params?.pageSize ?? 100,
                search: params?.search ?? "",
                sorting: params?.sorting ?? [{ id: "title", desc: false }],
                filters: params?.filters ?? [],
                dataFrom: params?.dataFrom
            }
        });
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getBoardGame = async (_id: string): Promise<ApiResponse<any>> => {
    try {
        return await axiosInstance.get(`${baseUrl}/boardgame/${_id}`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const addBoardGame = async (formData: any): Promise<any> => {
    try {
        if (
            (!Array.isArray(formData) && !formData._id) ||
            (Array.isArray(formData) && !formData[0]?._id)
        ) {
            return await axiosInstance.post(baseUrl + "/add-boardgame", formData);
        }

        if (Array.isArray(formData)) {
            const results = [];
            for (let i = 0; i < formData.length; i += BATCH_SIZE) {
                const batch = formData.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(async (boardGame: any) =>
                    await axiosInstance.put(`${baseUrl}/edit-boardgame/${boardGame._id}`, boardGame)
                );
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }
            return results;
        }

        return await axiosInstance.put(`${baseUrl}/edit-boardgame/${formData._id}`, formData);
    } catch (error: any) {
        console.error(error);
        throw new Error(error);
    }
};

export const countBGchildren = async (_id: string): Promise<ApiResponse<{ count: number }>> => {
    try {
        return await axiosInstance.get(`${baseUrl}/boardgame/count-children/${_id}`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const deleteBoardGame = async (_id: string): Promise<ApiResponse<ApiBookDataType>> => {
    try {
        return await axiosInstance.post(`${baseUrl}/delete-boardgame/${_id}`);
    } catch (error: any) {
        throw new Error(error);
    }
};