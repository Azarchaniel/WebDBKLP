declare module "mongoose" {
    export interface Document {
        _id: unknown;
    }
}

declare module "jsonwebtoken" {
    export interface JwtPayload {
        [key: string]: unknown;
    }
}
interface ImportMeta {
    env: Record<string, string | undefined>;
}