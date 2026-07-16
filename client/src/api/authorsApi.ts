import { ApiAutorDataType, BelongToAutor, IAutor } from "../type";
import { axiosInstance, baseUrl, BATCH_SIZE } from "./http";
import { ApiResponse, PaginationRequest, SavePayload } from "./types";

export const getAutors = async (params?: PaginationRequest): Promise<ApiResponse<ApiAutorDataType>> => {
    try {
        return await axiosInstance.get(
            baseUrl + "/autors", {
            params: {
                page: params?.page ?? 1,
                pageSize: params?.pageSize ?? 100,
                search: params?.search ?? "",
                sorting: params?.sorting ?? [{ id: "lastName", desc: false }],
                filterUsers: params?.activeUsers,
                dataFrom: params?.dataFrom
            }
        }
        );
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getAutor = async (_id: string): Promise<ApiResponse<ApiAutorDataType>> => {
    try {
        return await axiosInstance.get(`${baseUrl}/autor/${_id}`);
    } catch (error: any) {
        console.error("API ERROR");
        throw new Error(error);
    }
};

export const addAutor = async (formData: SavePayload<IAutor>): Promise<any> => {
    try {
        if (
            (!Array.isArray(formData) && !("id" in formData)) ||
            (Array.isArray(formData) && !formData[0]?._id)
        ) {
            return await axiosInstance.post(baseUrl + "/add-autor", formData);
        }

        if (Array.isArray(formData)) {
            const results = [];
            for (let i = 0; i < formData.length; i += BATCH_SIZE) {
                const batch = formData.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(async (autor: IAutor) =>
                    await axiosInstance.put(`${baseUrl}/edit-autor/${autor._id}`, autor)
                );
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }
            return results;
        }

        return await axiosInstance.put(
            `${baseUrl}/edit-autor/${(formData as unknown as IAutor)["_id"]}`,
            formData
        );
    } catch (error: any) {
        throw new Error(error);
    }
};

export const deleteAutor = async (_id: string): Promise<ApiResponse<ApiAutorDataType>> => {
    try {
        return await axiosInstance.post(`${baseUrl}/delete-autor/${_id}`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getAutorInfo = async (_id: string): Promise<ApiResponse<BelongToAutor>> => {
    try {
        return await axiosInstance.get(`${baseUrl}/get-autor-info/${_id}`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getMultipleAutorsInfo = async (autors: string[]): Promise<ApiResponse<BelongToAutor[]>> => {
    try {
        return await axiosInstance.post(`${baseUrl}/get-multiple-autors-info`, { ids: autors });
    } catch (error: any) {
        throw new Error(error);
    }
};