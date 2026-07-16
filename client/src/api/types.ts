import { AxiosResponse } from "axios";

export type ApiResponse<T = unknown> = AxiosResponse<T>;

export interface SortRequest {
    id: string;
    desc: boolean;
}

export interface PaginationRequest {
    page?: number;
    pageSize?: number;
    search?: string;
    sorting?: SortRequest[] | SortRequest;
    activeUsers?: string[];
    filters?: unknown[];
    dataFrom?: string | Date | number | null;
    signal?: AbortSignal;
}

export interface IdPaginationRequest extends PaginationRequest {
    ids?: string[];
}

export interface PageByLetterResponse {
    page: number;
}

export interface LatestUpdateResponse {
    latestUpdate: Date;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export type SavePayload<T> = T | T[];

export type UniqueFieldValuesResponse = Record<string, any[]>;