import { ApiUserDataType, IUser } from "../type";
import { axiosInstance, baseUrl } from "./http";
import { ApiResponse, LoginRequest } from "./types";

export const getUsers = async (): Promise<ApiResponse<ApiUserDataType>> => {
    try {
        return await axiosInstance.get(baseUrl + "/users");
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getUser = async (userId: string): Promise<ApiResponse<IUser>> => {
    try {
        return await axiosInstance.get(baseUrl + `/user/${userId}`);
    } catch (error: any) {
        throw new Error(error);
    }
};

export const login = async ({ email, password }: LoginRequest): Promise<ApiResponse<ApiUserDataType>> => {
    try {
        return await axiosInstance.post(`${baseUrl}/login`, {
            params: {
                email,
                password
            }
        });
    } catch (error: any) {
        throw new Error(error);
    }
};

export const logout = async (): Promise<ApiResponse> => {
    return axiosInstance.post(baseUrl + "/logout");
};

export const loginGuest = async (): Promise<ApiResponse<ApiUserDataType>> => {
    return axiosInstance.post(`${baseUrl}/login-guest`);
};