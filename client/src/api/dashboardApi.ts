import { axiosInstance, baseUrl } from "./http";
import { ApiResponse } from "./types";

export const countBooks = async (userId?: string): Promise<ApiResponse> => {
    try {
        return await axiosInstance.get(`${baseUrl}/count-books/${userId}`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getDimensionsStatistics = async (): Promise<ApiResponse> => {
    try {
        return await axiosInstance.get(`${baseUrl}/get-dimensions-statistics`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getLanguageStatistics = async (): Promise<ApiResponse> => {
    try {
        return await axiosInstance.get(`${baseUrl}/get-language-statistics`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getSizeGroups = async (): Promise<ApiResponse> => {
    try {
        return await axiosInstance.get(`${baseUrl}/get-size-groups`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getReadBy = async (): Promise<ApiResponse> => {
    try {
        return await axiosInstance.get(`${baseUrl}/get-read-by`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getOldestBooks = async (): Promise<ApiResponse> => {
    try {
        return await axiosInstance.get(`${baseUrl}/get-oldest-books`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getRecentlyUpdatedBooks = async (): Promise<ApiResponse> => {
    try {
        return await axiosInstance.get(`${baseUrl}/get-recently-updated-books`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getBiggestBooks = async (dimension: string = "height"): Promise<ApiResponse> => {
    try {
        return await axiosInstance.get(`${baseUrl}/get-biggest-books`, {
            params: { dimension }
        });
    } catch (error: any) {
        throw new Error(error);
    }
};