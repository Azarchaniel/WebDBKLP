import { ApiLPDataType, ILP } from "../type";
import { axiosInstance, baseUrl, BATCH_SIZE } from "./http";
import { ApiResponse, PaginationRequest, SavePayload } from "./types";

export const getLPs = async (params?: PaginationRequest): Promise<ApiResponse<ApiLPDataType>> => {
    try {
        return await axiosInstance.get(
            baseUrl + "/lps", {
            params: {
                page: params?.page ?? 1,
                pageSize: params?.pageSize ?? 100,
                search: params?.search ?? "",
                sorting: params?.sorting ?? { id: "lastName", desc: false },
                dataFrom: params?.dataFrom
            }
        }
        );
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getLP = async (_id: string): Promise<ApiResponse<ApiLPDataType>> => {
    try {
        return await axiosInstance.get(`${baseUrl}/lp/${_id}`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const addLP = async (formData: SavePayload<ILP>): Promise<any> => {
    try {
        if (
            (!Array.isArray(formData) && !("_id" in formData)) ||
            (Array.isArray(formData) && !formData[0]?._id)
        ) {
            const { published, ...lpData } = formData as ILP;
            const processedFormData = {
                ...lpData,
                published: {
                    ...published,
                    country: published?.country ?? ""
                },
            };

            return await axiosInstance.post(`${baseUrl}/add-lp`, processedFormData);
        }

        if (Array.isArray(formData)) {
            const results = [];
            for (let i = 0; i < formData.length; i += BATCH_SIZE) {
                const batch = formData.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(async (lp: ILP) =>
                    await axiosInstance.put(`${baseUrl}/edit-lp/${lp._id}`, lp)
                );
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }
            return results;
        }

        return await axiosInstance.put(`${baseUrl}/edit-lp/${(formData as unknown as ILP)._id}`, formData);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const deleteLP = async (_id: string): Promise<ApiResponse<ApiLPDataType>> => {
    try {
        return await axiosInstance.post(`${baseUrl}/delete-lp/${_id}`);
    } catch (error: any) {
        throw new Error(error);
    }
};