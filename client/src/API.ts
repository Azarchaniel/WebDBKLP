import axios, {AxiosRequestConfig, AxiosResponse} from "axios"
import {
    ApiAutorDataType,
    ApiBookDataType,
    ApiLPDataType,
    ApiQuoteDataType,
    ApiUserDataType,
    IBook,
    IUser
} from "./type";
import {toast} from "react-toastify";
import {jwtDecode} from "jwt-decode";

const baseUrl: string = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

const axiosInstance = axios.create({
    baseURL: baseUrl,
    withCredentials: true, // Enable cookies to be sent with requests
});

axiosInstance.interceptors.request.use(
    async (config: AxiosRequestConfig<any>): Promise<any> => {
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

            const {exp} = jwtDecode(token);
            const now = Date.now() / 1000;

            if (!exp) {
                console.error("Token has no expiration date!");
                return config;
            }

            if (exp - now < 60) {
                console.warn("Token is about to expire!");

                const response = await axios.post(baseUrl + '/refresh-token', {
                    refreshToken: localStorage.getItem('refreshToken'),
                });

                // Update tokens
                token = response.data.accessToken;
                localStorage.setItem('accessToken', token!);
                localStorage.setItem('refreshToken', response.data.refreshToken);

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
        console.error("Response error:", error);

        if (error.response?.status === 401) {
            console.warn("Unauthorized!");
        }

        const now = Date.now();
        if (now - lastLogTime > 10000) { // Check if 10 seconds have passed since the last log
            toast.warning("Neprihlásený užívateľ!");
            lastLogTime = now; // Update the last log time
        }

        return Promise.reject(error);
    }
);

interface IPageByLetter { page: number }
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
                    sorting: params?.sorting ?? [{id: "title", desc: false}],
                    filterUsers: params?.activeUsers
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
                    sorting: params?.sorting ?? [{id: "title", desc: false}],
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
    formData: IBook
): Promise<any> => {
    try {
        if (!formData._id) {
            const saveBook: AxiosResponse<ApiBookDataType> = await axiosInstance.post(
                baseUrl + "/add-book",
                formData
            )
            return saveBook
        } else {
            const updatedBook: AxiosResponse<ApiBookDataType> = await axiosInstance.put(
                `${baseUrl}/edit-book/${formData._id}`,
                formData
            )
            return updatedBook
        }
    } catch (error: any) {
        console.error(error);
        throw new Error(error)
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

//TODO: types
export const getInfoAboutBook = async (isbn: string): Promise<any> => {
    try {
        const bookInfo: AxiosResponse<any> = await axiosInstance.get(
            `${baseUrl}/get-book-info/${isbn}`
        )
        return bookInfo
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
                    sorting: params?.sorting ?? [{id: "lastName", desc: false}],
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
    formData: /*IAutor*/any
): Promise<AxiosResponse<ApiAutorDataType>> => {
    try {
        if (!formData._id) {
            const autor: any/*Omit<IAutor, '_id'>*/ = {
                firstName: formData.firstName ?? "",
                lastName: formData.lastName,
                nationality: formData.nationality ?? "",
                location: formData.location ?? {
                    city: "",
                    shelf: ""
                },
                note: formData.note ?? "",
                dateOfBirth: formData.dateOfBirth ?? undefined,
                dateOfDeath: formData.dateOfDeath ?? undefined,
                role: formData.role ?? undefined
            }
            return await axiosInstance.post(
                baseUrl + "/add-autor",
                autor
            )
        } else {
            return await axiosInstance.put(
                `${baseUrl}/edit-autor/${formData._id}`,
                formData
            )
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
    _id: string,
    role?: string[]
): Promise<AxiosResponse<ApiAutorDataType>> => {
    try {
        const enrichedAutor: AxiosResponse<ApiAutorDataType> = await axiosInstance.get(
            `${baseUrl}/get-autor-info/${_id}`,
            {
                params: {
                    role: role ? role.join(',') : []
                }
            }
        )
        return enrichedAutor
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
): Promise<AxiosResponse<ApiQuoteDataType>> => {
    try {
        const quote: any = {
            id: formData._id,
            text: formData.text,
            fromBook: formData.fromBook,
            pageNo: formData.pageNo ?? null,
            owner: formData.owner ?? [],
            note: formData.note
        }
        const saveQuote: AxiosResponse<ApiQuoteDataType> = await axiosInstance.post(
            baseUrl + "/add-quote",
            quote
        )
        return saveQuote
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
    {email, password}: {
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

// ### LP ###
export const getLPs = async (params?: any): Promise<AxiosResponse<ApiLPDataType>> => {
    try {
        const lps: AxiosResponse<ApiLPDataType> = await axiosInstance.get(
            baseUrl + "/lps", {
                params: {
                    page: params?.page ?? 1,
                    pageSize: params?.pageSize ?? 10_000,
                    search: params?.search ?? "",
                    sorting: params?.sorting ?? {id: "lastName", desc: false}
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
        console.error("API ERROR");
        throw new Error(error)
    }
}

export const addLP = async (
    formData: /*ILP*/any
): Promise<AxiosResponse<ApiLPDataType>> => {
    try {
        const {
            "published.country": country,
            ...lpData // Use rest operator to get the remaining properties
        } = formData;

        // Construct the lp object with the nested published property
        const lp: any = {
            ...lpData, // Spread the remaining properties
            published: {
                ...lpData["published"],
                country: country ?? ""
            },
        };

        const saveLP: AxiosResponse<ApiLPDataType> = await axiosInstance.post(
            baseUrl + "/add-lp",
            lp
        )
        return saveLP
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