import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import {
    ApiAutorDataType,
    ApiBookDataType,
    ApiLPDataType,
    ApiQuoteDataType,
    ApiUserDataType,
    BelongToAutor,
    IAutor,
    IBook,
    ILP,
    IUser
} from "./type";
import { jwtDecode } from "jwt-decode";

const baseUrl: string = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";
const BATCH_SIZE = 5;

const axiosInstance = axios.create({
    baseURL: baseUrl,
    withCredentials: true, // Enable cookies to be sent with requests
});

axiosInstance.interceptors.request.use(
    async (config: AxiosRequestConfig<any>): Promise<any> => {
        // Define public routes that don't need authentication
        const publicRoutes = [
            '/books',
            '/autors',
            '/book/',
            '/autor/',
            '/lps',
            '/lp/',
            '/boardgames',
            '/boardgame/',
            '/quotes',
            '/quote/'
        ];

        // Check if current request URL is a public route
        const isPublicRoute = publicRoutes.some(route =>
            config.url?.includes(route) && config.method?.toLowerCase() === 'get'
        );

        // Skip authentication for public GET routes
        if (isPublicRoute) {
            config.headers = {
                ...config.headers,
                "Content-Type": "application/json"
            };
            return config;
        }

        let token = localStorage.getItem("token");
        const refreshToken = localStorage.getItem('refreshToken');

        // Skip refresh if no refreshToken is available
        if (!refreshToken) {
            return config; // Pass through without refreshing the token
        }

        if (token) {
            config.headers = {
                ...config.headers,
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` // Attach token to Authorization header
            };

            const { exp } = jwtDecode(token);
            const now = Date.now() / 1000;

            if (!exp) {
                console.error("Token has no expiration date!");
                return config;
            }

            if (exp - now < 60) {
                const response = await axios.post(baseUrl + '/refresh-token', {
                    refreshToken: localStorage.getItem('refreshToken'),
                });
                // Update only the access token, do not update refresh token
                token = response.data.accessToken;
                localStorage.setItem('token', token!);
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        if (token) {
            config.headers!.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        // Handle request error
        console.error("Request error:", error);
        return Promise.reject(error);
    }
);

let lastLogTime = 0;

axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        // Just return the response if everything goes well
        return response;
    },
    (error) => {
        // Handle unauthorized errors (token expired)
        if (error.response?.status === 401) {
            console.warn("Unauthorized! Token may be expired.");

            // Clear auth data if unauthorized
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { exp } = jwtDecode(token);
                    const now = Date.now() / 1000;
                    if (!exp || exp < now) {
                        // Clear all auth data if token is expired
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');

                        // Force page reload to update auth state
                        window.location.href = '/';
                        return Promise.reject(new Error('Session expired. Please log in again.'));
                    }
                } catch (e) {
                    console.error("Error decoding token:", e);
                }
            }
        }

        const now = Date.now();
        if (now - lastLogTime > 10000) { // Check if 10 seconds have passed since the last log
            lastLogTime = now; // Update the last log time
        }

        return Promise.reject(error);
    }
);

interface IPageByLetter {
    page: number
}

export const getPageByStartingLetter = async (letter: string, pageSize: number, model: string, filterUsers?: string[]): Promise<AxiosResponse<IPageByLetter>> => {
    try {
        const response: AxiosResponse<IPageByLetter> = await axiosInstance.get(
            baseUrl + "/get-page-by-starting-letter", {
            params: {
                letter,
                pageSize,
                model,
                filterUsers
            }
        }
        );
        return response;
    } catch (error: any) {
        console.error("Cannot get page by starting letter: ", error);
        throw new Error(error);
    }
}

//### BOOK ###
export const getBooks = async (params?: any): Promise<AxiosResponse<ApiBookDataType>> => {
    try {
        const books: AxiosResponse<ApiBookDataType> = await axiosInstance.get(
            baseUrl + "/books", {
            params: {
                page: params?.page ?? 1, // API expects 1-based index
                pageSize: params?.pageSize ?? 10_000,
                search: params?.search ?? "",
                sorting: params?.sorting ?? [{ id: "title", desc: false }],
                filterUsers: params?.activeUsers,
                filters: params?.filters ?? []
            }
        });
        return books
    } catch (error: any) {
        throw new Error(error);
    }
}

export const getBooksByIds = async (params?: any): Promise<AxiosResponse<ApiBookDataType>> => {
    try {
        const books: AxiosResponse<ApiBookDataType> = await axiosInstance.get(
            baseUrl + "/books-by-ids", {
            params: {
                page: params?.page ?? 1, // API expects 1-based index
                pageSize: params?.pageSize ?? 10_000,
                search: params?.search ?? "",
                sorting: params?.sorting ?? [{ id: "title", desc: false }],
                ids: params?.ids ?? [],
            }
        });
        return books
    } catch (error: any) {
        console.error("Cannot get books by ids: ", error);
        throw new Error(error);
    }
}

export const checkBooksUpdated = async (dataFrom?: Date): Promise<AxiosResponse<{ latestUpdate: Date }>> => {
    try {
        const response: AxiosResponse<{ latestUpdate: Date }> = await axiosInstance.get(
            baseUrl + "/books/check-updated", {
            params: {
                dataFrom
            }
        }
        );
        return response;
    } catch (error: any) {
        throw new Error(error);
    }
};

export const getBook = async (
    _id: string
): Promise<AxiosResponse<ApiBookDataType>> => {
    try {
        const book: AxiosResponse<ApiBookDataType> = await axiosInstance.get(
            `${baseUrl}/book/${_id}`
        )
        return book
    } catch (error: any) {
        throw new Error(error)
    }
}

export const addBook = async (
    formData: IBook | IBook[] | object
): Promise<any> => {
    try {
        if (
            (!Array.isArray(formData) && !("id" in formData)) ||
            (Array.isArray(formData) && !formData[0]?._id)
        ) {
            const saveBook: AxiosResponse<ApiBookDataType> = await axiosInstance.post(
                baseUrl + "/add-book",
                formData
            );
            return saveBook;
        } else {
            if (Array.isArray(formData)) {
                // Process in batches of 5 books
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
            } else {
                const updatedBook: AxiosResponse<ApiBookDataType> = await axiosInstance.put(
                    `${baseUrl}/edit-book/${(formData as unknown as IBook)["_id"]}`,
                    formData
                );
                return updatedBook;
            }
        }
    } catch (error: any) {
        throw new Error(error);
    }
}

export const deleteBook = async (
    _id: string
): Promise<AxiosResponse<ApiBookDataType>> => {
    try {
        const deletedBook: AxiosResponse<ApiBookDataType> = await axiosInstance.post(
            `${baseUrl}/delete-book/${_id}`
        )
        return deletedBook
    } catch (error: any) {
        throw new Error(error)
    }
}

export const getInfoAboutBook = async (isbn: string): Promise<any> => {
    const bookInfo: AxiosResponse<any> = await axiosInstance.get(
        `${baseUrl}/get-book-info/${isbn}`
    )
    return bookInfo
}

export const getUniqueFieldValues = async (): Promise<AxiosResponse> => {
    try {
        const uniqueValues: AxiosResponse = await axiosInstance.get(
            `${baseUrl}/books/get-unique-field-values`
        )
        return uniqueValues
    } catch (error: any) {
        throw new Error(error)
    }
}

// ### AUTOR ###
export const getAutors = async (params?: any): Promise<AxiosResponse<ApiAutorDataType>> => {
    try {
        const autors: AxiosResponse<ApiAutorDataType> = await axiosInstance.get(
            baseUrl + "/autors", {
            params: {
                page: params?.page ?? 1, // API expects 1-based index
                pageSize: params?.pageSize ?? 10_000,
                search: params?.search ?? "",
                sorting: params?.sorting ?? [{ id: "lastName", desc: false }],
                filterUsers: params?.activeUsers,
                dataFrom: params?.dataFrom
            }
        }
        )
        return autors
    } catch (error: any) {
        throw new Error(error)
    }
}

export const getAutor = async (
    _id: string
): Promise<AxiosResponse<ApiAutorDataType>> => {
    try {
        const autor: AxiosResponse<ApiAutorDataType> = await axiosInstance.get(
            `${baseUrl}/autor/${_id}`
        );

        return autor;
    } catch (error: any) {
        console.error("API ERROR");
        throw new Error(error)
    }
}

export const addAutor = async (
    formData: IAutor | IAutor[] | object
): Promise<any> => {
    try {
        if (
            (!Array.isArray(formData) && !("id" in formData)) ||
            (Array.isArray(formData) && !formData[0]?._id)
        ) {
            const saveAutor: AxiosResponse<ApiAutorDataType> = await axiosInstance.post(
                baseUrl + "/add-autor",
                formData
            );
            return saveAutor;
        } else {
            if (Array.isArray(formData)) {
                // Process in batches of 5 autors
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
            } else {
                const updatedAutor: AxiosResponse<ApiAutorDataType> = await axiosInstance.put(
                    `${baseUrl}/edit-autor/${(formData as unknown as IAutor)["_id"]}`,
                    formData
                );
                return updatedAutor;
            }
        }
    } catch (error: any) {
        throw new Error(error)
    }
}

export const deleteAutor = async (
    _id: string
): Promise<AxiosResponse<ApiAutorDataType>> => {
    try {
        const deletedAutor: AxiosResponse<ApiAutorDataType> = await axiosInstance.post(
            `${baseUrl}/delete-autor/${_id}`
        )
        return deletedAutor
    } catch (error: any) {
        throw new Error(error)
    }
}

export const getAutorInfo = async (
    _id: string
): Promise<AxiosResponse<BelongToAutor>> => {
    try {
        const enrichedAutor: AxiosResponse<BelongToAutor> = await axiosInstance.get(
            `${baseUrl}/get-autor-info/${_id}`
        )
        return enrichedAutor
    } catch (error: any) {
        throw new Error(error)
    }
}

export const getMultipleAutorsInfo = async (
    autors: string[]
): Promise<AxiosResponse<BelongToAutor[]>> => {
    try {
        const enrichedAutors: AxiosResponse<BelongToAutor[]> = await axiosInstance.post(
            `${baseUrl}/get-multiple-autors-info`,
            { ids: autors }
        )
        return enrichedAutors
    } catch (error: any) {
        throw new Error(error)
    }
}

// ### QUOTES ###
export const getQuotes = async (filterByBook?: string[], activeUsers?: string[]): Promise<AxiosResponse<ApiQuoteDataType>> => {
    try {
        const quotes: AxiosResponse<ApiQuoteDataType> = await axiosInstance.get(
            baseUrl + "/quotes", {
            params: {
                activeUsers: activeUsers,
                filterByBook: filterByBook,
            }
        }
        )
        return quotes
    } catch (error: any) {
        throw new Error(error)
    }
}

export const getQuote = async (
    _id: string
): Promise<AxiosResponse<ApiQuoteDataType>> => {
    try {
        const quote: AxiosResponse<ApiQuoteDataType> = await axiosInstance.get(
            `${baseUrl}/quote/${_id}`
        );

        return quote;
    } catch (error: any) {
        throw new Error(error)
    }
}

export const addQuote = async (
    formData: any
): Promise<AxiosResponse<ApiQuoteDataType> | any> => {
    try {
        if (Array.isArray(formData)) {
            // Process in batches of 5 quotes
            const results = [];

            for (let i = 0; i < formData.length; i += BATCH_SIZE) {
                const batch = formData.slice(i, i + BATCH_SIZE);
                const batchPromises = batch.map(async (quoteData) => {
                    const quote: any = {
                        id: quoteData._id,
                        text: quoteData.text,
                        fromBook: quoteData.fromBook,
                        pageNo: quoteData.pageNo ?? null,
                        owner: quoteData.owner ?? [],
                        note: quoteData.note
                    };

                    if (!quote.id) {
                        return await axiosInstance.post(baseUrl + "/add-quote", quote);
                    } else {
                        return await axiosInstance.put(`${baseUrl}/edit-quote/${quote.id}`, quote);
                    }
                });
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
            }

            return results;
        } else {
            const quote: any = {
                id: formData._id,
                text: formData.text,
                fromBook: formData.fromBook,
                pageNo: formData.pageNo ?? null,
                owner: formData.owner ?? [],
                note: formData.note
            };

            if (!quote.id) {
                const saveQuote: AxiosResponse<ApiQuoteDataType> = await axiosInstance.post(
                    baseUrl + "/add-quote",
                    quote
                );
                return saveQuote;
            } else {
                const updatedQuote: AxiosResponse<ApiQuoteDataType> = await axiosInstance.put(
                    `${baseUrl}/edit-quote/${quote.id}`,
                    quote
                );
                return updatedQuote;
            }
        }
    } catch (error: any) {
        throw new Error(error)
    }
}

export const deleteQuote = async (
    _id: string
): Promise<AxiosResponse<ApiQuoteDataType>> => {
    try {
        const deletedQuote: AxiosResponse<ApiQuoteDataType> = await axiosInstance.post(
            `${baseUrl}/delete-quote/${_id}`
        )
        return deletedQuote
    } catch (error: any) {
        throw new Error(error)
    }
}

// ### USER ###
export const getUsers = async (): Promise<AxiosResponse<ApiUserDataType>> => {
    try {
        const users: AxiosResponse<ApiUserDataType> = await axiosInstance.get(
            baseUrl + "/users"
        )
        return users
    } catch (error: any) {
        throw new Error(error)
    }
}

export const getUser = async (userId: string): Promise<AxiosResponse<IUser>> => {
    try {
        const user: AxiosResponse<any> = await axiosInstance.get(
            baseUrl + `/user/${userId}`,
        )
        return user;
    } catch (error: any) {
        throw new Error(error)
    }
}

export const login = async (
    { email, password }: {
        email: string,
        password: string
    }
): Promise<AxiosResponse<ApiUserDataType>> => {
    try {
        const user: AxiosResponse<ApiUserDataType> = await axiosInstance.post(
            `${baseUrl}/login`, {
            params: {
                email: email,
                password: password
            }
        }
        );

        return user;
    } catch (error: any) {
        throw new Error(error)
    }
}

export const logout = async (refreshToken: string): Promise<AxiosResponse> => {
    return axiosInstance.post(baseUrl + "/logout", { refreshToken });
};

// ### LP ###
export const getLPs = async (params?: any): Promise<AxiosResponse<ApiLPDataType>> => {
    try {
        const lps: AxiosResponse<ApiLPDataType> = await axiosInstance.get(
            baseUrl + "/lps", {
            params: {
                page: params?.page ?? 1,
                pageSize: params?.pageSize ?? 10_000,
                search: params?.search ?? "",
                sorting: params?.sorting ?? { id: "lastName", desc: false }
            }
        }
        )
        return lps
    } catch (error: any) {
        throw new Error(error)
    }
}

export const getLP = async (
    _id: string
): Promise<AxiosResponse<ApiLPDataType>> => {
    try {
        const lp: AxiosResponse<ApiLPDataType> = await axiosInstance.get(
            `${baseUrl}/lp/${_id}`
        );

        return lp;
    } catch (error: any) {
        throw new Error(error)
    }
}

export const addLP = async (
    formData: ILP | ILP[] | object
): Promise<any> => {
    try {
        if (
            (!Array.isArray(formData) && !("_id" in formData)) ||
            (Array.isArray(formData) && !formData[0]?._id)
        ) {
            // Adding new LP(s)
            const { published, ...lpData } = formData as ILP;
            const processedFormData = {
                ...lpData,
                published: {
                    ...published,
                    country: published?.country ?? ""
                },
            };

            const newLP: AxiosResponse<ApiLPDataType> = await axiosInstance.post(
                `${baseUrl}/add-lp`,
                processedFormData
            );
            return newLP;
        } else {
            // Updating existing LP(s)
            if (Array.isArray(formData)) {
                // Process in batches of 5 LPs
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
            } else {
                const updatedLp: AxiosResponse<ApiLPDataType> = await axiosInstance.put(
                    `${baseUrl}/edit-lp/${(formData as unknown as ILP)._id}`,
                    formData
                )
                return updatedLp;
            }
        }
    } catch (error: any) {
        throw new Error(error)
    }
}

export const deleteLP = async (
    _id: string
): Promise<AxiosResponse<ApiLPDataType>> => {
    try {
        const deletedAutor: AxiosResponse<ApiLPDataType> = await axiosInstance.post(
            `${baseUrl}/delete-lp/${_id}`
        )
        return deletedAutor
    } catch (error: any) {
        throw new Error(error)
    }
}

export const countBooks = async (userId?: string): Promise<AxiosResponse> => {
    try {
        const count: AxiosResponse = await axiosInstance.get(
            `${baseUrl}/count-books/${userId}`
        )
        return count;
    } catch (error: any) {
        throw new Error(error);
    }
}

export const getDimensionsStatistics = async (): Promise<AxiosResponse> => {
    try {
        const statistics: AxiosResponse = await axiosInstance.get(
            `${baseUrl}/get-dimensions-statistics`,
        )
        return statistics;
    } catch (error: any) {
        throw new Error(error)
    }
}

export const getLanguageStatistics = async (): Promise<AxiosResponse> => {
    try {
        const statistics: AxiosResponse = await axiosInstance.get(
            `${baseUrl}/get-language-statistics`,
        )
        return statistics;
    } catch (error: any) {
        throw new Error(error)
    }
}

export const getSizeGroups = async (): Promise<AxiosResponse> => {
    try {
        const sizeGroups: AxiosResponse = await axiosInstance.get(
            `${baseUrl}/get-size-groups`,
        )
        return sizeGroups;
    } catch (error: any) {
        throw new Error(error)
    }
}

export const getReadBy = async (): Promise<AxiosResponse> => {
    try {
        const readBy: AxiosResponse = await axiosInstance.get(
            `${baseUrl}/get-read-by`,
        )
        return readBy;
    } catch (error: any) {
        throw new Error(error)
    }
}

// ### BOARD GAMES ###
export const getBoardGames = async (params?: any): Promise<AxiosResponse<any>> => {
    try {
        const boardGames: AxiosResponse<ApiBookDataType> = await axiosInstance.get(
            baseUrl + "/boardgames", {
            params: {
                page: params?.page ?? 1, // API expects 1-based index
                pageSize: params?.pageSize ?? 10_000,
                search: params?.search ?? "",
                sorting: params?.sorting ?? [{ id: "title", desc: false }],
                filters: params?.filters ?? []
            }
        });
        return boardGames
    } catch (error: any) {
        throw new Error(error);
    }
}

export const getBoardGame = async (
    _id: string
): Promise<AxiosResponse<any>> => {
    try {
        const boardGame: AxiosResponse<ApiBookDataType> = await axiosInstance.get(
            `${baseUrl}/boardgame/${_id}`
        )
        return boardGame
    } catch (error: any) {
        throw new Error(error)
    }
}

export const addBoardGame = async (
    formData: any
): Promise<any> => {
    try {
        if (
            (!Array.isArray(formData) && !formData._id) ||
            (Array.isArray(formData) && !formData[0]?._id)
        ) {
            const saveBoardGame: AxiosResponse<any> = await axiosInstance.post(
                baseUrl + "/add-boardgame",
                formData
            )
            return saveBoardGame
        } else {
            if (Array.isArray(formData)) {
                // Process in batches of 5 board games
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
            } else {
                const updatedBoardGame: AxiosResponse<any> = await axiosInstance.put(
                    `${baseUrl}/edit-boardgame/${formData._id}`,
                    formData
                )
                return updatedBoardGame
            }
        }
    } catch (error: any) {
        console.error(error);
        throw new Error(error)
    }
}

export const countBGchildren = async (
    _id: string
): Promise<AxiosResponse<{ count: number }>> => {
    try {
        const response: AxiosResponse<{ count: number }> = await axiosInstance.get(
            `${baseUrl}/boardgame/count-children/${_id}`
        )
        return response
    } catch (error: any) {
        throw new Error(error)
    }
}

export const deleteBoardGame = async (
    _id: string
): Promise<AxiosResponse<ApiBookDataType>> => {
    try {
        const deletedBoardGame: AxiosResponse<any> = await axiosInstance.post(
            `${baseUrl}/delete-boardgame/${_id}`
        )
        return deletedBoardGame
    } catch (error: any) {
        throw new Error(error)
    }
}